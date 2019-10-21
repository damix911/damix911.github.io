import json
import random

with open("lines-original.json", "r") as f:
  lines = json.load(f)

for line in lines:
  line["color"] = random.choice([[217, 134, 149], [109, 155, 195]])

with open("lines.json", "w") as f:
  json.dump(lines, f)