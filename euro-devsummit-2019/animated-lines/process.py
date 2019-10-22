import json
# import random

with open("lines-lr-original.json", "r") as f:
  lines = json.load(f)

surf_green = [161, 210, 135]
shimmering_blush = [217, 134, 149]
cerulean_frost = [109, 155, 195]
red = [255, 0, 0]
blue = [0, 0, 255]

for line in lines:
  # line["color"] = random.choice([cerulean_frost, shimmering_blush])
  line["startColor"] = red
  line["endColor"] = blue

with open("lines-lr.json", "w") as f:
  json.dump(lines, f)