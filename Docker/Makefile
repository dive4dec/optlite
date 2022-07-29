
# Variable
## Image
location=williamtang2000/
image_name=sfg7yds79g7sdg78sd68g97sd79gy7h9 # Random image name avoiding missing a image_name parameter when using "make remove"
image=$(location)$(image_name)

# remove the image by location and name
remove_image:
	sudo docker images | grep $(image) | awk '{print $$3 }' | xargs -I {} docker rmi {}
# Remove images who have "<none>" tag
remove_none_image:
	sudo docker images | awk '{ print $$1,$$2,$$3 }' | grep none | awk '{print $$3 }' | xargs -I {} docker rmi {}
