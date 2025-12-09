import json
import boto3
import os
import ast
from datetime import datetime

session = boto3.Session()

############################################################################ HTML
BODY_HTML_PREAMBLE = """
<html>
<head>
<style>
table, th, td {{
  border: 1px solid black;
  border-collapse: collapse;
  padding: 5px;
}}
th {{
  background-color: #f2f2f2;
}}
</style>
</head>
<body>
  <h3>Detect running Resources in all regions for {}</h3>
  <p>
  <table>
"""

BODY_HTML_APPENDIX = """
  </table>
  </p>
</body>
</html>
"""
############################################################################ END HTML

############################################################################ Functions

def get_credentials(accountid):
    sts_client = boto3.client('sts')
    try:
        assumed_role_object = sts_client.assume_role(
            RoleArn=f"arn:aws:iam::{accountid}:role/ProdAccount-Lambda-Assume-Role",
            RoleSessionName="cross_acct_lambda"
        )
        credentials = assumed_role_object['Credentials']
        print(f"Successfully assumed role for account {accountid}")
        return credentials
    except Exception as e:
        print(f"Error assuming role for account {accountid}: {str(e)}")
        raise

def get_body(date, table_body):
    html_body = BODY_HTML_PREAMBLE.format(date)
    html_body += table_body
    html_body += BODY_HTML_APPENDIX
    return html_body

def get_regions():
    ec2_client = session.client('ec2')
    regions = [r['RegionName'] for r in ec2_client.describe_regions()['Regions']]
    if 'me-south-1' in regions:
        regions.remove('me-south-1')
    return regions

def get_combined_status(table_body, credentials, accountname):
    table_body += f'<tr><th bgcolor="#82FF82" colspan="5">{accountname} EC2 and RDS Instances</th></tr>\n'
    table_body += '<tr><th>Region</th><th>EC2 Running</th><th>EC2 Stopped</th><th>RDS Running</th><th>RDS Stopped</th></tr>\n'

    regions = get_regions()

    for region in regions:
        # EC2
        if accountname == 'Production':
            ec2_resource = boto3.resource('ec2', region_name=region)
        else:
            ec2_resource = boto3.resource(
                'ec2',
                region_name=region,
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken']
            )
        try:
            ec2_instances = list(ec2_resource.instances.all())
            ec2_running = sum(1 for i in ec2_instances if i.state['Name'] == 'running')
            ec2_stopped = sum(1 for i in ec2_instances if i.state['Name'] == 'stopped')
        except Exception as e:
            print(f"Error describing EC2 instances in {region}: {str(e)}")
            ec2_running = ec2_stopped = 0

        # RDS
        if accountname == 'Production':
            rds_client = boto3.client('rds', region_name=region)
        else:
            rds_client = boto3.client(
                'rds',
                region_name=region,
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken']
            )
        try:
            response = rds_client.describe_db_instances()
            rds_instances = response.get('DBInstances', [])
            rds_running = sum(1 for db in rds_instances if db['DBInstanceStatus'] == 'available')
            rds_stopped = sum(1 for db in rds_instances if db['DBInstanceStatus'] != 'available')
        except Exception as e:
            print(f"Error describing RDS instances in {region}: {str(e)}")
            rds_running = rds_stopped = 0

        # Only include regions with at least one running/stopped resource
        if any([ec2_running, ec2_stopped, rds_running, rds_stopped]):
            table_body += f'<tr><td>{region}</td><td>{ec2_running}</td><td>{ec2_stopped}</td><td>{rds_running}</td><td>{rds_stopped}</td></tr>\n'

    return table_body

############################################################################ Main

def lambda_handler(event, context):
    result_table_body = ''
    Accounts = ast.literal_eval(os.environ['accounts'])

    for account in Accounts:
        credentials = ''
        if account != 'Production':
            credentials = get_credentials(Accounts[account])

        # Combined EC2 + RDS status
        result_table_body = get_combined_status(result_table_body, credentials, account)

    ######################## Send Email
    ses = boto3.client('ses', 'us-east-1')
    SENDER = "admin@payfort.com"
    CHARSET = "UTF-8"
    today = datetime.utcnow().strftime("%d-%m-%Y")
    SUBJECT = f"APS Running EC2 and RDS Instances For {today}"

    try:
        html_body = get_body(today, result_table_body)
        response = ses.send_email(
            Destination={'ToAddresses': os.environ['recipients'].split(',')},
            Message={
                'Body': {'Html': {'Charset': CHARSET, 'Data': html_body}},
                'Subject': {'Charset': CHARSET, 'Data': SUBJECT},
            },
            Source=SENDER
        )
        print(f"Email sent successfully with MessageId: {response['MessageId']}")
    except Exception as e:
        print(f"Reporting failed due to: {str(e)}")
        raise
    else:
        print(f"Reporting completed successfully at {str(datetime.now())}")
