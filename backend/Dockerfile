# Use an official AWS Lambda Python base image (adjust version as needed)
FROM public.ecr.aws/lambda/python:3.10

# Install any extra packages if needed (for example, system-level dependencies)
# RUN yum install -y <package-name>

# Copy requirements.txt and install Python dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

# Copy all project files into the Lambda task root directory
COPY . ${LAMBDA_TASK_ROOT}

# Optionally, expose a port if you plan to test the container locally (not required for Lambda)
# EXPOSE 8080

# Set the CMD to your Lambda handler (this is an example; adjust if your handler is in a different module)
CMD [ "main.lambda_handler" ]
