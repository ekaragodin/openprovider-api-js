const request = require('request');
const {Builder, parseString, processors} = require('xml2js');
const _ = require('lodash');
const DEFAULT_URL = 'https://api.openprovider.eu';

module.exports.xml = (config) => {
    return (requestName, args = {}) => {
        return executeRequest({
            [requestName + 'Request']: args,
        }, config);
    }
};

function executeRequest(body, config) {
    return new Promise((resolve, reject) => {
        const builder = new Builder();

        body = mapToApi({
            openXML: Object.assign({
                credentials: config.credentials,
            }, body),
        });

        request({
            method: 'POST',
            url: config.url || DEFAULT_URL,
            body: builder.buildObject(body),
            agentOptions: {
                rejectUnauthorized: false
            },
        }, (error, response, body) => {
            if (!error && response.statusCode) {
                parseResponse(body, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            } else {
                reject(error || body);
            }
        });
    });
}

function parseResponse(response, cb) {
    parseString(
        response,
        {
            explicitArray: false,
            emptyTag: null,
            valueProcessors: [
                processors.parseNumbers,
            ],
        },
        (err, result) => {
            if (err) {
                cb(err);
            } else {
                cb(null, mapFromApi(result.openXML.reply));
            }
        });
}

function mapToApi(data) {
    if (_.isObject(data)) {
        return _.mapValues(data, (value) => {
            if (_.isArray(value)) {
                return {
                    array: {
                        item: value,
                    }
                };
            }

            return mapToApi(value);
        });
    }

    return data;
}

function mapFromApi(data) {
    if (_.has(data, 'array.item')) {
        return [].concat(_.get(data, 'array.item'));
    }

    if (_.isObject(data)) {
        return _.mapValues(data, (value) => mapFromApi(value));
    }

    return data;
}
