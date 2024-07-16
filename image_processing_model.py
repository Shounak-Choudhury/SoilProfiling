import sys
from PIL import Image

print("Hello")

input_image=Image.open(sys.argv[1])
input_image.show()