var request = require('request');
var {Builder, parseString, processors} = require('xml2js');
var _ = require('lodash');
var defaultUrl = 'https://api.openprovider.eu';

module.exports.xml = function (config) {
    return function (requestName, args) {
        var body = {};

        body[requestName + 'Request'] = args || {};

        return executeRequest(body, config);
    }
};

function executeRequest(body, config) {
    return new Promise(function (resolve, reject) {
        var builder = new Builder();

        body = mapToApi({
            openXML: Object.assign({
                credentials: config.credentials,
            }, body),
        });

        request({
            method: 'POST',
            url: config.url || defaultUrl,
            body: builder.buildObject(body),
            agentOptions: {
                rejectUnauthorized: false
            },
        }, function (error, response, body) {
            if (!error && response.statusCode) {
                parseResponse(body, function (err, result) {
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
        function (err, result) {
            if (err) {
                cb(err);
            } else {
                cb(null, mapFromApi(result.openXML.reply));
            }
        });
}

function mapToApi(data) {
    var result;

    if (_.isObject(data)) {
        result = _.mapValues(data, function (value) {
            if (_.isArray(value)) {
                return {
                    array: {
                        item: value,
                    }
                };
            }

            return mapToApi(value);
        });
    } else {
        result = data;
    }

    return result;
}

function mapFromApi(data) {
    var result;

    if (_.has(data, 'array.item')) {
        result = [].concat(_.get(data, 'array.item'));
    } else if (_.isObject(data)) {
        result = _.mapValues(data, function (value) {
            return mapFromApi(value);
        });
    } else {
        result = data;
    }

    return result;
}
