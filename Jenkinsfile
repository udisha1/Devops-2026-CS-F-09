pipeline {
    agent any

    stages {
        stage('Checkout SCM') {
            steps {
                echo 'Checking out code from Git...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies for Root, Client, and Server...'
                script {
                    if (isUnix()) {
                        sh 'npm install'
                        sh 'cd client && npm install'
                        sh 'cd server && npm install'
                    } else {
                        bat 'npm install'
                        bat 'cd client && npm install'
                        bat 'cd server && npm install'
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React client...'
                script {
                    if (isUnix()) {
                        sh 'cd client && npm run build'
                    } else {
                        bat 'cd client && npm run build'
                    }
                }
            }
        }

        stage('Verify Build') {
            steps {
                echo 'Verifying built artifacts...'
                script {
                    if (isUnix()) {
                        sh 'ls -la client/dist'
                    } else {
                        bat 'dir client\\dist'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
        }
        success {
            echo 'Build and verification completed successfully!'
        }
        failure {
            echo 'Build failed. Please inspect build logs.'
        }
    }
}
