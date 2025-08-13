Dockerising instructions:
Set lambda to CMD [ "main.lambda_handler" ]

docker buildx build --platform linux/amd64 --provenance=false -t neolectra:test .
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 654654357990.dkr.ecr.ap-south-1.amazonaws.com
aws ecr create-repository --repository-name neolectra --region ap-south-1 --image-scanning-configuration scanOnPush=true 
docker tag neolectra:test 654654357990.dkr.ecr.ap-south-1.amazonaws.com/neolectra:latest
docker push 654654357990.dkr.ecr.ap-south-1.amazonaws.com/neolectra:latest