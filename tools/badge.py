# Builds the badge card + clip in Blender and exports a GLB.
# Card is centered at the origin, 1.6 x 2.25 units, front faces +Z.
import bpy, bmesh, math, sys
from mathutils import Vector

OUT = sys.argv[-1]
W, H, T, R = 1.6, 2.25, 0.024, 0.09
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
bev = card.modifiers.new('bevel', 'BEVEL'); bev.width = 0.007; bev.segments = 3; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(60)
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

# ── clip: a flat metal clamp through the slot, with a ring on top for the lanyard
# the clip is ai (DESIGN.md), a little metallic so it catches light
metal = mat('metal', (0.012, 0.06, 0.087), 0.6, 0.32)
clamp = slab('clamp', rounded_rect(0.22, 0.16, 0.03, 6), 0.045)
clamp.location = (0, SY + 0.05, 0)
bpy.ops.mesh.primitive_torus_add(major_radius=0.07, minor_radius=0.014, major_segments=40, minor_segments=12,
                                 location=(0, SY + 0.21, 0), rotation=(0, 0, 0))
ring = bpy.context.active_object; ring.name = 'ring'
for ob in (clamp, ring):
    ob.data.materials.append(metal)
    for p in ob.data.polygons: p.use_smooth = True
clip = bpy.data.objects.new('clip', None); scene.collection.objects.link(clip)
clamp.parent = clip; ring.parent = clip

# stand the badge up: modeled in XY facing +Z, glTF wants Y-up facing +Z
for ob in (card, clamp, ring):
    ob.parent = None
for ob in (card, clamp, ring):
    ob.matrix_world = __import__('mathutils').Matrix.Rotation(math.pi/2, 4, 'X') @ ob.matrix_world
bpy.ops.object.select_all(action='DESELECT')
for ob in (card, clamp, ring): ob.select_set(True)
bpy.context.view_layer.objects.active = card
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.data.objects.remove(clip)
clip = bpy.data.objects.new('clip', None); scene.collection.objects.link(clip)
clamp.parent = clip; ring.parent = clip
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True,
                          export_texcoords=True, export_normals=True, export_materials='EXPORT')
print('anchor_y', SY + 0.21 + 0.07, 'tris', sum(len(o.data.polygons) for o in (card, clamp, ring)))
