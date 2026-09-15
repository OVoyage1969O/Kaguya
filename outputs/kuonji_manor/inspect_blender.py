import bpy
print([(m.name,[(n.name,n.type) for n in m.node_tree.nodes] if m.node_tree else None) for m in bpy.data.materials])
