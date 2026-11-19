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
JR = 0.075
jump = ring('jump', SY + JR, JR, 0.011)
parts.append(jump)
# lobster clasp: a teardrop of wire, wide at the bottom where it hooks the ring
cb = SY + 2 * JR - 0.02          # clasp bottom, hooked over the ring top
CH, CW = 0.34, 0.075
pts = []
for i in range(64):
    t = 2 * math.pi * i / 64     # 0 at the top
    wf = 0.5 + 0.5 * (1 - math.cos(t)) / 2
    pts.append((CW * math.sin(t) * wf * 1.6, cb + CH / 2 + CH / 2 * math.cos(t), 0))
clasp = rod('clasp', pts, 0.025)
clasp.scale.z = 0.75; bpy.context.view_layer.objects.active = clasp; clasp.select_set(True); bpy.ops.object.transform_apply(scale=True); clasp.select_set(False)
parts.append(clasp)
# the gate lever: a small nub on the right side of the clasp
nub = rod('nub', [(CW * 0.95, cb + CH * 0.42, 0), (CW * 1.45, cb + CH * 0.5, 0)], 0.02, closed=False)
parts.append(nub)
# swivel barrel and the eye the lanyard loops through
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.026, depth=0.07, location=(0, cb + CH + 0.03, 0),
                                    rotation=(math.pi / 2, 0, 0))
barrel = bpy.context.active_object; barrel.name = 'barrel'
bpy.ops.object.shade_smooth()
parts.append(barrel)
EYE = 0.055
eye = ring('eye', cb + CH + 0.065 + EYE, EYE, 0.012, plane='YZ')
parts.append(eye)
for ob in parts:
    ob.data.materials.clear()
    ob.data.materials.append(metal)
    for p in ob.data.polygons: p.use_smooth = True
ANCHOR = cb + CH + 0.065 + 2 * EYE
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
    bpy.ops.object.camera_add(location=(1.4, -4.2, 1.2))
    cam = bpy.context.active_object; scene.camera = cam
    d = mathutils.Vector((0, 0, 0.35)) - cam.location
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
