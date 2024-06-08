import os
import re
import os
import re
import cv2
import sys
import time
import shutil
import zipfile
import urllib.request
import numpy as np
from PIL import Image
from os import listdir
from os.path import isfile, join
from random import randrange
import matplotlib.pyplot as plt

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Activation, Flatten
from tensorflow.keras.layers import Conv2D, MaxPooling2D



file = 'soil_photos.zip'
url = 'http://apmonitor.com/pds/uploads/Main/'+file
urllib.request.urlretrieve(url, file)


with zipfile.ZipFile(file, 'r') as zip_ref:
    zip_ref.extractall('./')
os.remove(file)

training_data_directory= 'train'
test_data_directory= 'test'

#original_stdout = sys.stdout
#sys.stdout = open(os.devnull, 'w')

training_data_processor = ImageDataGenerator(
    rescale = 1./255,
    horizontal_flip = True,
    zoom_range = 0.2,
    rotation_range = 10,
    shear_range = 0.2,
    height_shift_range = 0.1,
    width_shift_range = 0.1
)

test_data_processor = ImageDataGenerator(rescale = 1./255)


# Load data 
training_data = training_data_processor.flow_from_directory(
    training_data_directory,
    target_size = (256, 256),
    batch_size = 32,
    class_mode = 'categorical',
    
)

testing_data = test_data_processor.flow_from_directory(
    test_data_directory,
    target_size = (256 ,256),
    batch_size = 32,
    class_mode = 'categorical',
    shuffle = False,
    

)

#sys.stdout=original_stdout

from tensorflow.keras.layers import Dropout


layer_size = 32
epochs = 50
LEARNING_RATE= 0.06

model_mine= Sequential([  
    Conv2D(32, (3,3), activation= "relu", input_shape= (256,256, 3)),
    MaxPooling2D(pool_size=(2, 2)),
    #Dropout(LEARNING_RATE),

    #Conv2D(32, (3,3), activation= "relu"), MaxPooling2D(), Dropout(LEARNING_RATE),
    Conv2D(32, (3,3), activation= "relu"),
    MaxPooling2D(pool_size=(2, 2)),
   
   
    #Dropout(LEARNING_RATE),
    Flatten(),
    Dense(32, activation= "relu"),
    #Dense(32, activation= "relu"),
    Dense(3, activation= "softmax") #Because of 3 categories
])
model_mine.summary() 


model_mine.compile(loss='categorical_crossentropy',
                optimizer='adam',
                metrics=['accuracy'],
                )

'''model_mine.fit(training_data,
            epochs= epochs,
            validation_data = testing_data)'''

#import pickle as pkl
#pickle.dump(model_mine, open('model_mine.pkl', 'wb'))

model_mine.save(f'{"model_mine"}.h5')

def make_prediction(image_file):
    im= cv2.imread(image_file)
    plt.imshow(im[:,:,[2,1,0]])
    
    img = image.load_img(image_file, target_size = (256,256))
    img = image.img_to_array(img)
    img_array= img/255.
    
    img_batch = np.expand_dims(img_array, axis = 0)
    
    class_ = ["Gravel", "Sand", "Silt"] # possible output values
    predicted_value = class_[model_mine.predict(img_batch).argmax()]
    true_value = re.search(r'(Gravel)|(Sand)|(Silt)', image_file)[0]
    
    pred_out= f"""Predicted Soil Type: {predicted_value}
    True Soil Type: {true_value}"""
    
    return pred_out


def split_images(img_dir, save_dir):
    categories= ['Gravel', 'Sand', 'Silt']
    for category in categories:
        folder = img_dir + '/' + category + '/'
        save_folder = save_dir + '/' + category + '/'
        files = [f for f in listdir(folder) if isfile(join(folder, f))]
        
        for file in files:
            if 'ini' in file:
                continue
            fp= folder + file #file path
            

            img = cv2.imread(fp)
            h,w,c = img.shape
            im_dim = 64
            
            for r in range(0,img.shape[0],im_dim):
                for c in range(0,img.shape[1],im_dim):
                    cropped_img = img[r:r+im_dim, c:c+im_dim,:]
                    ch, cw, cc = cropped_img.shape
                    
                    if ch== im_dim and cw== im_dim:
                        write_path= f"{save_folder + str(randrange(100000))}img{r}_{c}.jpg"
                        cv2.imwrite(write_path,cropped_img)
                    else:
                        pass
                    
#Since the images are organised into folders named after their primary constituent, what this function does here is that we are cropping the image into segments, which would give us a better idea of the constituents of the photos

try:
    parent= training_data_directory.replace('train', '')
    
    dirs = ['train_divided', 'test_divided']
    class_ = ["Gravel", "Sand", "Silt"]
    
    for dir in dirs:
        os.mkdir(os.path.join(parent, dir))
        for category in class_:
            os.mkdir(os.path.join(parent, dir, category))
            
        split_images(img_dir=training_data_directory,
                save_dir=training_data_directory.replace('train', 'train_divided'))
        split_images(img_dir=test_data_directory,
                save_dir=test_data_directory.replace('test', 'test_divided'))
except FileExistsError:
    pass


#model= model_mine #replace by load_model('Saved model file path')
model= load_model('model_mine.h5')

def classify_images(image_file, model):
    classes = ['Gravel', 'Sand', 'Silt']
    gravel_count = 0
    sand_count = 0
    silt_count = 0
    
    img= cv2.imread(image_file)
    img= cv2.resize(img, (1024, 1024))
    im_dim= 256
    
    #Now we go through the classification of each segment
    for r in range(0, img.shape[0], im_dim):
        for c in range(0, img.shape[1], im_dim):
            cropped_img= img[r:r + im_dim, c:c + im_dim, :]
            h, w, c= cropped_img.shape
        if h== im_dim and w== im_dim:
                classification= model_classify(cropped_img, model)
                if classification== 'Gravel':
                    gravel_count+= 1
                elif classification== 'Sand':
                    sand_count += 1
                elif classification== 'Silt':
                    silt_count += 1
        else:
                continue
    total_count = gravel_count + sand_count + silt_count
    proportion_array = [gravel_count / total_count, sand_count / total_count, silt_count / total_count]
    return proportion_array

def model_classify(cropped_img, model):
    classes = ['Gravel', 'Sand', 'Silt']
    image_array = cropped_img / 255.
    img_batch = np.expand_dims(image_array, axis=0)
    prediction_array = model.predict(img_batch)[0]
    first_idx = np.argmax(prediction_array)
    first_class = classes[first_idx]
    return first_class

def classify_percentage(image_file):
    start = time.time()
    out = classify_images(image_file=image_file, model=model) #tuple which returns (Gravel, Sand, Silt) values respectively
    
    im = cv2.imread(image_file) # load image
    plt.imshow(im[:,:,[2, 1, 0]])
    

   # outdata={"Gravel":out[0],"Sand":out[1],"Silt":out[2]}
    #sys.stdout.write(outdata)
    sys.stdout.write(f'''
    Gravel percentage= {round(out[0]*100, 3)}%
    Sand percentage= {round(out[1]*100, 3)}%
    Silt percentage= {round(out[2]*100, 3)}%'''
    ) #rounded off to three decimal places. The tuple 'out' contains the result'''
    
#Output

sample_image_path= sys.argv[1] #replace by own image path
#C:\Users\amogh\Desktop\Sustainivo_internship\shutterstock_614429543.jpg

#display test image
im= cv2.imread(sample_image_path)
plt.imshow(im[:,:,[2,1,0]])

classify_percentage(sample_image_path)
