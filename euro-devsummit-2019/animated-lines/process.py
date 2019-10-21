import json
import random

with open("lines-original.json", "r") as f:
  lines = json.load(f)

surf_green = [161, 210, 135]
shimmering_blush = [217, 134, 149]
cerulean_frost = [109, 155, 195]

for line in lines:
  line["color"] = random.choice([cerulean_frost, shimmering_blush])

with open("lines.json", "w") as f:
  json.dump(lines, f)