pipeline {
  agent any

  environment {
    IMAGE_NAME = "sricharanns/three-tier-backend"
    IMAGE_TAG  = "${BUILD_NUMBER}"
  }

  stages {

    stage('Detect Environment') {
      steps {
        script {
          if (env.BRANCH_NAME == 'develop') {
            env.ENV_NAME = 'dev'
            env.BACKEND_EC2 = 'DEV_BACKEND_PRIVATE_IP'
          }
          else if (env.BRANCH_NAME == 'qa') {
            env.ENV_NAME = 'qa'
            env.BACKEND_EC2 = 'QA_BACKEND_PRIVATE_IP'
          }
          else if (env.BRANCH_NAME == 'main') {
            env.ENV_NAME = 'prod'
            env.BACKEND_EC2 = 'PROD_BACKEND_PRIVATE_IP'
          }
          else {
            error "Unsupported branch: ${env.BRANCH_NAME}"
          }

          echo "Deploying to environment: ${env.ENV_NAME}"
        }
      }
    }

    stage('Checkout Code') {
      steps {
        checkout scm
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build -t $IMAGE_NAME:$IMAGE_TAG backend/
        '''
      }
    }

    stage('Push Image to Docker Hub') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-creds',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
            docker push $IMAGE_NAME:$IMAGE_TAG
          '''
        }
      }
    }

    stage('Deploy Backend') {
      steps {
        sshagent(['backend-ssh']) {
          sh """
            ssh -o StrictHostKeyChecking=no ubuntu@${BACKEND_EC2} '
              docker pull ${IMAGE_NAME}:${IMAGE_TAG} &&
              docker stop backend || true &&
              docker rm backend || true &&
              docker run -d \
                --name backend \
                -p 3000:3000 \
                -e ENV_NAME=${ENV_NAME} \
                ${IMAGE_NAME}:${IMAGE_TAG}
            '
          """
        }
      }
    }
  }

  post {
    success {
      echo "Deployment successful for ${ENV_NAME}"
    }
    failure {
      echo "Deployment failed"
    }
  }
}
