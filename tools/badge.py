# Builds the badge card + clip in Blender and exports a GLB.
# Card is centered at the origin, 1.6 x 2.25 units, front faces +Z.
import bpy, bmesh, math, sys
from mathutils import Vector

OUT = next(a for a in sys.argv if a.endswith('.glb'))
W, H, T, R = 1.6, 2.25, 0.032, 0.09   # a thick PVC card, like a printed event badge
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def rounded_rect(w, h, r, seg=12):
    pts = []
    for cx, cy, a0 in [(w/2-r, h/2-r, 0), (-w/2+r, h/2-r, 90), (-w/2+r, -h/2+r, 180), (w/2-r, -h/2+r, 270)]:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r*math.cos(a), cy + r*math.sin(a)))
    return pts

def slab(name, pts, depth, z0=0.0):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((x, y, z0 - depth/2)) for x, y in pts]
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in ext['geom']:
        if isinstance(v, bmesh.types.BMVert): v.co.z += depth
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    return ob

def mat(name, rgb, metal=0.0, rough=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    return m

# ── card with a slot cut out (the one hole is the only ornament)
card = slab('card', rounded_rect(W, H, R), T)
# slot matches DESIGN.md: 200 x 28 px centered at y=78 on the 1024 x 1440 face
SW, SH = 200 / 1024 * W, 28 / 1440 * H
SY = (1 - 78 / 1440) * H - H / 2
cut = slab('slotcut', rounded_rect(SW, SH, SH/2 - 0.001, 8), T * 4)
cut.location.y = SY
bpy.context.view_layer.update()
mod = card.modifiers.new('slot', 'BOOLEAN'); mod.operation = 'DIFFERENCE'; mod.object = cut; mod.solver = 'EXACT'
bpy.context.view_layer.objects.active = card
bpy.ops.object.modifier_apply(modifier='slot')
bpy.data.objects.remove(cut)
bev = card.modifiers.new('bevel', 'BEVEL'); bev.width = 0.012; bev.segments = 5; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(60)
bpy.ops.object.modifier_apply(modifier='bevel')

# materials by face normal: 0 face (front), 1 back, 2 edge
card.data.materials.clear()  # the boolean leaves an empty slot behind
for m in (mat('face', (0.9, 0.88, 0.82), 0.0, 0.35), mat('back', (0.9, 0.88, 0.82), 0.0, 0.35), mat('edge', (0.85, 0.83, 0.78), 0.0, 0.45)):
    card.data.materials.append(m)
bm = bmesh.new(); bm.from_mesh(card.data)
uv = bm.loops.layers.uv.new('UVMap')
for f in bm.faces:
    n = f.normal
    f.material_index = 0 if n.z > 0.99 else 1 if n.z < -0.99 else 2
    for l in f.loops:
        x, y = l.vert.co.x, l.vert.co.y
        u, v = (x + W/2) / W, (y + H/2) / H
        if f.material_index == 1: u = 1 - u     # back reads correctly from behind
        l[uv].uv = (u, v)
bmesh.ops.triangulate(bm, faces=bm.faces)
bm.to_mesh(card.data); bm.free()
for p in card.data.polygons: p.use_smooth = False

# ── fittings: a jump ring through the slot, a lobster clasp on it, and a
# swivel with an eye on top for the lanyard. Polished steel, like a real badge.
metal = mat('metal', (0.78, 0.78, 0.76), 1.0, 0.3)

def rod(name, pts, radius, closed=True):
    """A round wire along a path of (x, y, z) points."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = radius; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, (x, y, z) in zip(sp.points, pts): p.co = (x, y, z, 1)
    sp.use_cyclic_u = closed
    ob = bpy.data.objects.new(name, cu); scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob.select_set(False)
    return ob

def ring(name, cy, major, minor, plane='YZ', n=48):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        if plane == 'YZ': pts.append((0, cy + major * math.cos(a), major * math.sin(a)))
        else: pts.append((major * math.sin(a), cy + major * math.cos(a), 0))
    return rod(name, pts, minor)

parts = []
# jump ring: stands across the card so it passes through the slot
# an oval link, tall enough that the clasp hangs clear of the card's top edge
JR, JA = 0.06, 0.17          # half width (across the card) and half height
jump = rod('jump', [(0, SY + JA - JA * math.cos(2 * math.pi * i / 56), JR * math.sin(2 * math.pi * i / 56))
                    for i in range(56)], 0.011)
parts.append(jump)
# lobster clasp, built like the real thing: a chunky pressed claw with a
# small eye-shaped hole, thick along the back, a thin spring gate closing the
# left side, a ridged trigger tab on the gate, a tapered neck, and a small
# swivel ring the lanyard loops through.
CB_BEV = 0.018                       # the rounded edge that softens every outline
cb = SY + 2 * JA - 0.011 - CB_BEV - 0.03   # claw bottom: the jump ring rests in its hole
HO = 0.40                            # claw height (outline, before the rounded edge)

def rod_tapered(name, pts, radii, flat=1.0, closed=False):
    """A wire whose thickness changes along its length (per-point radius)."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = 1.0; cu.bevel_resolution = 5; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, (x, y, z), r in zip(sp.points, pts, radii):
        p.co = (x, y, z, 1); p.radius = r
    sp.use_cyclic_u = closed
    ob = bpy.data.objects.new(name, cu); scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob.scale.z = flat
    bpy.ops.object.transform_apply(scale=True)
    ob.select_set(False)
    return ob

def plate(name, loop, half_thick, bevel, z=0.0):
    """A flat outline pressed into a pillowy solid: rounded on every edge."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
    cu.extrude = max(half_thick - bevel, 0.0005); cu.bevel_depth = bevel; cu.bevel_resolution = 4
    sp = cu.splines.new('POLY'); sp.points.add(len(loop) - 1)
    for p, (x, y) in zip(sp.points, loop): p.co = (x, y, 0, 1)
    sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name, cu); scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob.select_set(False)
    ob.location.z = z
    return ob

def outer(t):
    """The claw's outline. t runs clockwise from the neck (0): down the thick
    back on the right, under the round bottom, up the gate side on the left."""
    a = 2 * math.pi * t
    wf = 0.42 + 0.58 * (1 - math.cos(a)) / 2
    sx = 0.14 if math.sin(a) > 0 else 0.12
    return (sx * math.sin(a) * wf, cb + HO / 2 * (1 + math.cos(a)))

def inner(t):
    """The hole: a small egg, low and toward the gate side."""
    a = 2 * math.pi * t
    wf = 0.8 + 0.2 * (1 - math.cos(a)) / 2
    return (-0.016 + 0.056 * math.sin(a) * wf, cb + 0.152 + 0.122 * math.cos(a))

def span(f, t0, t1, n):
    return [f(t0 + (t1 - t0) * i / n) for i in range(n + 1)]

TIP, GTOP = 0.68, 0.915   # where the claw's tip ends and where the gate meets the body
body_loop = span(outer, 0.0, TIP, 70) + span(inner, TIP, GTOP - 1, 60)
body = plate('claw', body_loop, 0.03, CB_BEV)
parts.append(body)
# the gate fills the gap, a touch thinner, with a hairline seam at each end
gate_loop = span(outer, TIP + 0.016, 0.99, 24) + span(inner, GTOP - 0.008, TIP + 0.014, 16)
gate = plate('gate', gate_loop, 0.022, 0.011)
parts.append(gate)
# the trigger: a thin tab on the gate's outside, ridged for a thumb
gx, gy = outer(0.875)
tab_loop = [(gx + 0.01, gy - 0.026), (gx - 0.045, gy - 0.012), (gx - 0.055, gy + 0.01), (gx - 0.035, gy + 0.03), (gx + 0.01, gy + 0.024)]
tab = plate('tab', tab_loop, 0.011, 0.008)
parts.append(tab)
for k in range(3):
    rx = gx - 0.014 - 0.012 * k
    for zs in (1, -1):
        parts.append(rod_tapered(f'ridge{k}{zs}', [(rx, gy - 0.014, zs * 0.011), (rx - 0.004, gy + 0.018, zs * 0.011)],
                                 [0.0035, 0.0035]))

# the neck: a short tapered stem from the top of the claw up to the swivel
neck_y0 = cb + HO
neck = rod_tapered('neck', [(0, neck_y0, 0), (0, neck_y0 + 0.05, 0), (0, neck_y0 + 0.08, 0)],
                   [0.03, 0.02, 0.025], flat=0.85)
parts.append(neck)
# swivel collar, then a small ring standing across the card for the lanyard
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.03, depth=0.03, location=(0, neck_y0 + 0.095, 0),
                                    rotation=(math.pi / 2, 0, 0))
collar = bpy.context.active_object; collar.name = 'collar'
bev2 = collar.modifiers.new('b', 'BEVEL'); bev2.width = 0.006; bev2.segments = 3
bpy.ops.object.modifier_apply(modifier='b')
parts.append(collar)
# the webbing loop: a flat rounded bar loop facing you, wide enough for the
# lanyard to wrap over its top bar (a narrow ring would pinch the webbing)
LW, LH, LR, LWIRE = 0.38, 0.11, 0.035, 0.012
loop_y0 = neck_y0 + 0.11 + LWIRE                    # bottom bar sits on the swivel
loop_pts = [(x, y + loop_y0 + LH / 2, 0) for x, y in rounded_rect(LW, LH, LR, 8)]
webloop = rod('webloop', loop_pts, LWIRE)
parts.append(webloop)
ANCHOR = loop_y0 + LH                                # the band wraps over the top bar
for ob in parts:
    ob.data.materials.clear()
    ob.data.materials.append(metal)
    for p in ob.data.polygons: p.use_smooth = True
clip = bpy.data.objects.new('clip', None); scene.collection.objects.link(clip)

# stand the badge up: modeled in XY facing +Z, glTF wants Y-up facing +Z
for ob in [card] + parts:
    ob.matrix_world = __import__('mathutils').Matrix.Rotation(math.pi/2, 4, 'X') @ ob.matrix_world
bpy.ops.object.select_all(action='DESELECT')
for ob in [card] + parts: ob.select_set(True)
bpy.context.view_layer.objects.active = card
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.data.objects.remove(clip)
clip = bpy.data.objects.new('clip', None); scene.collection.objects.link(clip)
for ob in parts: ob.parent = clip
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True,
                          export_texcoords=True, export_normals=True, export_materials='EXPORT')
print('anchor_y', round(ANCHOR, 3), 'tris', sum(len(o.data.polygons) for o in [card] + parts))
if '--render' in sys.argv:
    # a check render, for looking at the fittings (not shipped)
    import mathutils
    close = '--close' in sys.argv     # a close look at the clasp
    look = mathutils.Vector((0, 0, 1.25)) if close else mathutils.Vector((0, 0, 0.35))
    bpy.ops.object.camera_add(location=(0.5, -1.5, 1.45) if close else (1.4, -4.2, 1.2))
    cam = bpy.context.active_object; scene.camera = cam
    d = look - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 50
    bpy.ops.object.light_add(type='AREA', location=(-1.5, -3, 3)); bpy.context.active_object.data.energy = 400
    bpy.ops.object.light_add(type='AREA', location=(2, -1, 2)); bpy.context.active_object.data.energy = 150
    w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.8, 0.55, 0.2, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    for m in card.data.materials:   # glossy plastic, like the site's material
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (0.012, 0.06, 0.087, 1)
        b.inputs['Roughness'].default_value = 0.45
        b.inputs['Coat Weight'].default_value = 1.0
        b.inputs['Coat Roughness'].default_value = 0.06
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 24; scene.cycles.device = 'CPU'
    scene.render.resolution_x, scene.render.resolution_y = 800, 800
    scene.render.filepath = sys.argv[sys.argv.index('--render') + 1]
    bpy.ops.render.render(write_still=True)
