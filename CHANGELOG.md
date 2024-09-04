## 1.0.0

### Shiny new things

- Auto layout
    - Support `Right to left` and `Left to right` mindmap directions
    - Support `Top to bottom` and `Bottom to top` mindmap directions
    - Support node auto resize when text is changed
    - Support move node out of mindmap;
    - Support trigger auto layout when node is changed;
    - Support trigger auto layout when node is deleted;
- Settings for all features
    - Change hotkey to edit node/create next sibling node/create previous sibling node;
    - Set width, height, gap between nodes;
    - Set default mindmap direction;
    - Set ignore files regex;
- Better navigation between nodes
- Context menu for node
    - Create sibling node;
    - Create child node;
    - Select node's tree;
- Commands (All commands will ignore if current file is being edited in canvas)
    - Create child node;
    - Create sibling node;
    - Create floating node;
    - Open changelog;
    - Enter/exit edit mode;
- Hotkeys (All hotkeys can change current mindmap direction)
    - `Mod + Shift + ArrowLeft` to create a new child node on the left side of the current node;
    - `Mod + Shift + ArrowRight` to create a new child node on the right side of the current node;
    - `Mod + Shift + ArrowUp` to create a new child node on the top side of the current node;
    - `Mod + Shift + ArrowDown` to create a new child node on the bottom side of the current node;


### Bug fixes

- Cannot enter edit mode when create a new node;
- Cannot delete node when node is the only child of its parent/only node in the mindmap;
- 
