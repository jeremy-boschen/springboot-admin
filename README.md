For deployment in your Kubernetes environment, you'll just need to:

Ensure the app has the necessary permissions to interact with the K8s API
Set the useRealCluster flag to true in server/k8s/client.ts
Optionally, adjust the service discovery interval and metrics collection frequency