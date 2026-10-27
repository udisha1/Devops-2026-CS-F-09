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
                bat 'docker compose up -d'
                bat 'docker ps'
            }
        }
    }
    post {
        failure { echo 'Pipeline failed, check console output' }
    }
}