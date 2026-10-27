pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Clean Old Containers') {
            steps { bat 'docker compose down' }
        }
        stage('Build') {
            steps { bat 'docker compose build' }
        }
        stage('Deploy') {
    steps {
        withCredentials([file(credentialsId: 'taskflow-server-env', variable: 'ENV_FILE')]) {
            bat 'copy /Y "%ENV_FILE%" server\\.env'
            bat 'docker compose up -d'
            bat 'docker ps'
        }
    }
}
    }
    post {
        failure { echo 'Pipeline failed, check console output' }
    }
}