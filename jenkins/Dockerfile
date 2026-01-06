FROM jenkins/jenkins:lts

USER root

# Cài đặt Docker CLI trong container Jenkins
RUN apt-get update && \
    apt-get install -y docker.io && \
    apt-get clean

# Thêm user jenkins vào group docker để dùng docker.sock
RUN usermod -aG docker jenkins


USER jenkins