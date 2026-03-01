const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    endpoint: 'https://58def0ae215e5c9a4c24d11c2b6dd494.r2.cloudflarestorage.com',
    region: 'auto',
    credentials: {
        accessKeyId: '1cd058df191b291a81ecc54ee0163043',
        secretAccessKey: 'ed60fba4aa71b00ead338ca7bbd1ccbfdb49dc9477a65cb84b690c6dff596250',
    },
    forcePathStyle: true,
});

s3.send(new PutObjectCommand({
    Bucket: 'alcor-marketplace',
    Key: 'test/hello.txt',
    Body: 'hello world',
    ContentType: 'text/plain',
}))
    .then((r) => console.log('SUCCESS', JSON.stringify(r.$metadata, null, 2)))
    .catch((e) => console.error('ERROR', e.Code, e.message, JSON.stringify(e.$metadata, null, 2)));
