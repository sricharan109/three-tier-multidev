pipeline {
  agent { label 'docker' } 

  environment {
    IMAGE_NAME = "sricharanns/three-tier-backend"
    IMAGE_TAG  = "${BUILD_NUMBER}"
  }

  stages {

    /* =========================
       ENVIRONMENT SELECTION
       ========================= */
    stage('Detect Environment') {
      steps {
        script {
          if (env.BRANCH_NAME == 'develop') {
            env.ENV_NAME    = 'dev'
            env.BACKEND_EC2 = '10.0.134.200'
            env.DB_HOST     = 'dev-db.cuhao8aouanz.us-east-1.rds.amazonaws.com'
            env.DB_NAME     = 'dev-db'
            env.DB_USER     = 'admin'
            env.DB_PASS     = credentials('dev-db-pass')
          }
          else if (env.BRANCH_NAME == 'qa') {
            env.ENV_NAME    = 'qa'
            env.BACKEND_EC2 = '10.0.139.102'
            env.DB_HOST     = 'qa-db.cuhao8aouanz.us-east-1.rds.amazonaws.com'
            env.DB_NAME     = 'qa-db'
            env.DB_USER     = 'admin'
            env.DB_PASS     = credentials('qa-db-pass')
          }
          else if (env.BRANCH_NAME == 'main') {
            env.ENV_NAME    = 'prod'
            env.BACKEND_EC2 = '10.0.142.36'
            env.DB_HOST     = 'prod-db.cuhao8aouanz.us-east-1.rds.amazonaws.com'
            env.DB_NAME     = 'prod-db'
            env.DB_USER     = 'admin'
            env.DB_PASS     = credentials('prod-db-pass')
          }
          else {
            error "❌ Unsupported branch: ${env.BRANCH_NAME}"
          }

          echo "🚀 Deploying ${env.BRANCH_NAME} → ${env.ENV_NAME}"
        }
      }
    }

    /* =========================
       CHECKOUT
       ========================= */
    stage('Checkout Code') {
      steps {
        checkout scm
      }
    }

    /* =========================
       BUILD IMAGE
       ========================= */
    stage('Build Docker Image') {
      steps {
        sh '''
          docker build -t $IMAGE_NAME:$IMAGE_TAG backend/
        '''
      }
    }

    /* =========================
       PUSH IMAGE
       ========================= */
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

    /* =========================
       DEPLOY BACKEND
       ========================= */
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
                -e DB_HOST=${DB_HOST} \
                -e DB_USER=${DB_USER} \
                -e DB_PASS=${DB_PASS} \
                -e DB_NAME=${DB_NAME} \
                ${IMAGE_NAME}:${IMAGE_TAG}
            '
          """
        }
      }
    }
  }

  post {
    success {
      echo "✅ ${ENV_NAME} deployment successful"
    }
    failure {
      echo "❌ ${ENV_NAME} deployment failed"
    }
  }
}
