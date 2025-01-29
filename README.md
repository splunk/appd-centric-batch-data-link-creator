# Node script to generate Terraform script file & external data links for an olly environment

## Description

NodeJS script to generate terraform script file and create AppD Tier URL data links for the specified olly env.

This project contains NodeJS script file to generate terraform script file and then create AppD Tier URL data links from a csv file (eg: linkFile.csv)

linkFile.csv needs to follow the below `specific pattern`

The first line should contain the column headers - `OllyInferredServiceName,AppDLinkLabel,AppDLink`

Next it should have the data with 3 entries per each line (row) - 
`Olly Inferred Service Name`, `AppD Link Label`, `AppD Link URL`

Example csv:

OllyInferredServiceName,AppDLinkLabel,AppDLink
cassandra,tier8nov,https://test.saas.appdynamics.com/controller/#/location=APP_COMPONENT_MANAGER&timeRange=last_1_week.BEFORE_NOW.-1.-1.10080&application=1&component=1&dashboardMode=force

cassandra,RileyTestDownstream,https://test.saas.appdynamics.com/controller/#/location=APP_COMPONENT_MANAGER&timeRange=last_1_week.BEFORE_NOW.-1.-1.10080&application=1&component=2&dashboardMode=force

redis,Linux-AWS-Fargate-WebAPI,https://test.saas.appdynamics.com/controller/#/location=APP_COMPONENT_MANAGER&timeRange=last_1_week.BEFORE_NOW.-1.-1.10080&application=2&component=3&dashboardMode=force



## Prerequisites

- Install NodeJS https://nodejs.org/en/download/package-manager
- Install Terraform CLI https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli
- Have the required env url and user auth token

## Getting started

To generate the AppD Tier URL data links terraform script follow the below steps

1. npm install
2. node createAppDLinkTerraformScript.js `<path_to_csv_file>` `<olly_env_url>` `<auth_token>`

This will first generate the terrafrom script file under `appDDataLink.tf` in root folder. 

It will then use the same file to create a external data links using terraform commands in the specified environment.

We use terraform init, plan and apply commands to create required resources and data links

Using the generated terraform script file user can now run it to create external links for Olly inferred services

If you want to delete the AppD links which have been created using the terraform script file (`appDDataLink.tf`) you can run the below command

`terraform destroy -var="signalfx_api_url=<Olly_Env_URL>" -var="signalfx_auth_token=<your_user_API_access_token>"`


## Output Logs
If all the resources are added successfully then we would see a log message as 

`Apply complete! Resources: 10 added, 0 changed, 10 destroyed.`

However, if there are errors while trying to add data links then you would see some error logs.
Below is a sample error log for an invalid Appd Link

`Error: enter a valid AppD Link. The link needs to include the contoller URL, application ID, and Application component`
 