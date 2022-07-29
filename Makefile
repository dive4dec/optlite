# Variable
## Image
location=williamtang2000/
image_name=mytutor_frontend
image=$(location)$(image_name)
version = v4.4.2
image_id=$(image):$(version)
## Container port
host_port=8000
container_port=80


# Execute the image
run:
# sudo docker run --restart=always --user=myapp --cap-drop all -d -p 8010:8080 williamtang2000/mytutor_backend_python:v2.2.2
	sudo docker run --name $(image_name) -d -p $(host_port):$(container_port) $(image_id)
stop_all:
# sudo docker ps | awk '{ print $$1,$$2 }' | grep williamtang2000/mytutor_backend_python| awk '{print $$1 }' | xargs -I {} docker stop {}
	sudo docker ps | awk '{ print $$1,$$2 }' | grep $(image_name) | awk '{print $$1 }' | xargs -I {} docker stop {}
# Remove all $(image) container
	sudo docker ps -a | awk '{ print $$1,$$2 }' | grep $(image_name) | awk '{print $$1 }' | xargs -I {} docker rm {}
# Push the image to remote hub
push:
	sudo docker push $(image_id)

# Build the image
build_image:
	npm run production-build
	sudo docker build -t $(image_id) .

# Get the remote image
update: 
	sudo docker pull $(image_id)

# Package the image to the remote hub
package: build_image push

# Build local version and run it
deploy_local: stop_all build_image run
# Pull remote version and run it
deploy: stop_all update run

test:
	sudo make stop_all
	npm run production-build
	sudo docker build -t $(image_id) .
	make run