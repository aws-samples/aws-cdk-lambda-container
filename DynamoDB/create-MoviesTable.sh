aws dynamodb --region us-east-1 create-table \
    --table-name Movies \
    --attribute-definitions \
        AttributeName=year,AttributeType=N \
        AttributeName=title,AttributeType=S \
    --key-schema \
        AttributeName=year,KeyType=HASH  \
        AttributeName=title,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5
