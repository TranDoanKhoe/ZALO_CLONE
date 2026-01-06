pipeline {
    agent any

    environment {
        DOCKER_TAG = "1"
        AWS_REGION = "ap-southeast-1"
        EB_APPLICATION_NAME_BE = "zalo-app-be"
        EB_ENVIRONMENT_NAME_BE = "ZaloAppBe-env"
        EB_APPLICATION_NAME_FE = "zalo-app-fe"
        EB_ENVIRONMENT_NAME_FE = "ZaloAppFe-env"
        S3_BUCKET = "your-s3-bucket"
    }

    tools {
        maven 'Maven'
        jdk 'JDK17'
        nodejs 'NodeJS'
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/luongtandat0512/Zalo_Clone', branch: 'TanNha', credentialsId: 'github-credentials'
            }
        }

        stage('Build BE') {
            steps {
                dir('Zalo_App_BE') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Test BE') {
            steps {
                dir('Zalo_App_BE') {
                    sh 'mvn test'
                }
            }
        }

        stage('Build FE') {
            steps {
                dir('Zalo_Clone_FE') {
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    script {
                        def beImageTag = "${DOCKER_USERNAME}/zalo_clone-backend:${DOCKER_TAG}"
                        def feImageTag = "${DOCKER_USERNAME}/zalo_clone-frontend:${DOCKER_TAG}"

                        // Login
                        sh """echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin"""

                        // Build BE image
                        dir('Zalo_App_BE') {
                            sh "docker build -t ${beImageTag} ."
                            sh "docker push ${beImageTag}"
                        }

                        // Build FE image
                        dir('Zalo_Clone_FE') {
                            sh "docker build -t ${feImageTag} ."
                            sh "docker push ${feImageTag}"
                        }

                        // Save image tags for deploy
                        env.BE_IMAGE_TAG = beImageTag
                        env.FE_IMAGE_TAG = feImageTag
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            cleanWs()
        }
        success {
            echo "✅ Build #${env.BUILD_NUMBER} thành công"
        }
        failure {
            echo "❌ Build #${env.BUILD_NUMBER} thất bại"
        }
    }
}
