const {xml} = require('../src');
const config = {
    credentials: {
        username: 'username',
        password: 'password',
    }
};
const client = xml(config);

client('searchDomain')
    .then((result) => {
        console.log(result);
    });

client('searchDomain',
    {
        limit: 5,
        offset: 0,
        orderBy: 'domainName',
        order: 'asc',
    })
    .then((result) => {
        console.log(result);
    });
