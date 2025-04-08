// Define keys arrays
const keys = [
    'ResponseCode',
    'Response200',
    'Response201',
    'Response204',
    'Response400',
    'Response401',
    'Response403',
    'Response404',
    'IsNull',
    'IsNotNull',
    'IsEqual',
    'IsNotEqual',
    'IsGreaterThan',
    'IsGreaterOrEqualTo',
    'IsLessThan',
    'IsLessOrEqualTo',
    'AllResponseFieldsNotNull',
    'ResponseTime',
    'GetVariable',
    'SetVariable',
    'DeleteVariable',
    'Description'
];

const helperKeys = [
    'GenerateKeys',
    'InWhitelist',
    'GenerateKeysFromObject',
    'GenerateKeyString',
    'TestFieldIsOnReponse',
    'FindFieldInArray',
    'GenerateTestDesc'
];

// Helper functions
const Helper = {
    GenerateKeys: (fields) => {
        const generatedKeys = [];
        for (const key in fields) {
            if (!fields.hasOwnProperty(key)) continue;

            const obj = fields[key];
            if (obj === Object(obj)) {
                generatedKeys.push(key);
                Helper.GenerateKeysFromObject(obj, [key], generatedKeys);
                continue;
            }
            generatedKeys.push(key);
        }
        return generatedKeys;
    },

    InWhitelist: (keyString, whitelist, fuzzySearch = false) => {
        if (!Array.isArray(whitelist)) {
            whitelist = [whitelist];
        }

        const keyArray = keyString.includes('.') ? keyString.split('.') : [keyString];
        const lowerKeyArray = keyArray.map(x => x.toLowerCase());

        if (whitelist.includes(lowerKeyArray[0])) {
            return true;
        }

        return whitelist.some(item => 
            fuzzySearch ? keyString.includes(item) : keyString.startsWith(item)
        );
    },

    GenerateKeysFromObject: (obj, parents = [], keys = []) => {
        for (const prop in obj) {
            if (!obj.hasOwnProperty(prop)) continue;

            parents.push(prop);
            if (obj[prop] === Object(obj[prop])) {
                Helper.GenerateKeysFromObject(obj[prop], parents, keys);
            } else {
                Helper.GenerateKeyString(prop, parents, keys);
            }
            parents.pop();
        }
        return keys;
    },

    GenerateKeyString: (prop, parents, keys) => {
        const keyString = [...parents.slice(0, -1), prop].join('.');
        keys.push(keyString);
    },

    TestFieldIsOnReponse: (keys, whitelist) => {
        if (!Array.isArray(whitelist)) {
            whitelist = [whitelist];
        }

        const lowerWhitelist = whitelist.map(x => x.toLowerCase());
        const keySearch = keys.map(x => x.toLowerCase());

        lowerWhitelist.forEach(item => {
            pm.test(`${item} is on the response object`, () => {
                pm.expect(Helper.FindFieldInArray(item, keySearch)).to.be.true;
            });
        });
    },

    FindFieldInArray: (field, array) => {
        return array.some(item => {
            const rootLevel = array.includes(field);
            const subItem = item.includes(`.${field}.`);
            const subItemEnd = item.endsWith(`.${field}`);
            return rootLevel || subItem || subItemEnd;
        });
    },

    GenerateTestDesc: (defaultDesc) => {
        const desc = pm.variables.get('testDescription') || defaultDesc;
        pm.variables.set('testDescription', null);
        return desc;
    }
};

// Core test functions
const Test = {
    ResponseCode: (code = 200) => {
        const desc = Helper.GenerateTestDesc(`Response is ${code}`);
        pm.test(desc, () => {
            pm.response.to.have.status(code);
        });
    },

    Response200: () => Test.ResponseCode(200),
    Response201: () => Test.ResponseCode(201),
    Response204: () => Test.ResponseCode(204),
    Response400: () => Test.ResponseCode(400),
    Response401: () => Test.ResponseCode(401),
    Response403: () => Test.ResponseCode(403),
    Response404: () => Test.ResponseCode(404),

    IsNull: (whitelist, fuzzySearch = false) => {
        if (!whitelist) {
            throw new Error("Required property 'whitelist' not found in test IsNull");
        }

        const responseJson = pm.response.json();
        const keys = Helper.GenerateKeys(responseJson);

        if (!Array.isArray(whitelist)) {
            whitelist = [whitelist];
        }

        const lowerWhitelist = whitelist.map(x => x.toLowerCase());
        Helper.TestFieldIsOnReponse(keys, whitelist);

        keys.forEach(key => {
            if (Helper.InWhitelist(key, lowerWhitelist, fuzzySearch)) {
                pm.test(`${key} is null`, () => {
                    const value = key.split('.').reduce((o, i) => o[i], responseJson);
                    pm.expect(value).to.be.null;
                });
            }
        });
    },

    IsNotNull: (whitelist, fuzzySearch = false) => {
        if (!whitelist) {
            throw new Error("Required property 'whitelist' not found in test NotNull");
        }

        const responseJson = pm.response.json();
        const keys = Helper.GenerateKeys(responseJson);

        if (!Array.isArray(whitelist)) {
            whitelist = [whitelist];
        }

        const lowerWhitelist = whitelist.map(x => x.toLowerCase());
        Helper.TestFieldIsOnReponse(keys, whitelist);

        keys.forEach(key => {
            if (Helper.InWhitelist(key, lowerWhitelist, fuzzySearch)) {
                pm.test(`${key} is not null`, () => {
                    const value = key.split('.').reduce((o, i) => o[i], responseJson);
                    pm.expect(value).to.not.be.null;
                    
                    if (typeof value === 'string') {
                        pm.expect(value.trim()).to.not.have.lengthOf(0);
                    } else if (typeof value === 'object') {
                        pm.expect(Object.keys(value)).to.not.have.lengthOf(0);
                    }
                });
            }
        });
    },

    IsEqual: (field, expected) => {
        if (!field) {
            throw new Error("Required property 'field' not found in test IsEqual");
        }
        if (expected === undefined) {
            throw new Error("Required property 'expected' not found in test IsEqual");
        }

        const desc = Helper.GenerateTestDesc(`${field} equals ${expected}`);
        const responseJson = pm.response.json();
        const actual = field.split('.').reduce((o, i) => o[i], responseJson);

        pm.test(desc, () => {
            pm.expect(actual).to.equal(expected);
        });
    },

    IsNotEqual: (field, expected) => {
        if (!field) {
            throw new Error("Required property 'field' not found in test IsNotEqual");
        }
        if (expected === undefined) {
            throw new Error("Required property 'expected' not found in test IsNotEqual");
        }

        const desc = Helper.GenerateTestDesc(`${field} does not equal ${expected}`);
        const responseJson = pm.response.json();
        const actual = field.split('.').reduce((o, i) => o[i], responseJson);

        pm.test(desc, () => {
            pm.expect(actual).to.not.equal(expected);
        });
    },

    IsGreaterThan: (field, expected) => {
        if (!field) {
            throw new Error("Required property 'field' not found in test IsGreaterThan");
        }
        if (expected === undefined) {
            throw new Error("Required property 'expected' not found in test IsGreaterThan");
        }

        const desc = Helper.GenerateTestDesc(`${field} is greater than ${expected}`);
        const responseJson = pm.response.json();
        const actual = field.split('.').reduce((o, i) => o[i], responseJson);

        pm.test(desc, () => {
            pm.expect(actual).to.be.above(expected);
        });
    },

    IsGreaterOrEqualTo: (field, expected) => {
        if (!field) {
            throw new Error("Required property 'field' not found in test IsGreaterOrEqualTo");
        }
        if (expected === undefined) {
            throw new Error("Required property 'expected' not found in test IsGreaterOrEqualTo");
        }

        const desc = Helper.GenerateTestDesc(`${field} is greater than or equal to ${expected}`);
        const responseJson = pm.response.json();
        const actual = field.split('.').reduce((o, i) => o[i], responseJson);

        pm.test(desc, () => {
            pm.expect(actual).to.be.at.least(expected);
        });
    },

    IsLessThan: (field, expected) => {
        if (!field) {
            throw new Error("Required property 'field' not found in test IsLessThan");
        }
        if (expected === undefined) {
            throw new Error("Required property 'expected' not found in test IsLessThan");
        }

        const desc = Helper.GenerateTestDesc(`${field} is less than ${expected}`);
        const responseJson = pm.response.json();
        const actual = field.split('.').reduce((o, i) => o[i], responseJson);

        pm.test(desc, () => {
            pm.expect(actual).to.be.below(expected);
        });
    },

    IsLessOrEqualTo: (field, expected) => {
        if (!field) {
            throw new Error("Required property 'field' not found in test IsLessOrEqualTo");
        }
        if (expected === undefined) {
            throw new Error("Required property 'expected' not found in test IsLessOrEqualTo");
        }

        const desc = Helper.GenerateTestDesc(`${field} is less than or equal to ${expected}`);
        const responseJson = pm.response.json();
        const actual = field.split('.').reduce((o, i) => o[i], responseJson);

        pm.test(desc, () => {
            pm.expect(actual).to.be.at.most(expected);
        });
    },

    AllResponseFieldsNotNull: () => {
        const responseJson = pm.response.json();
        const keys = Helper.GenerateKeys(responseJson);

        keys.forEach(key => {
            pm.test(`${key} is not null`, () => {
                const value = key.split('.').reduce((o, i) => o[i], responseJson);
                pm.expect(value).to.not.be.null;
                
                if (typeof value === 'string') {
                    pm.expect(value.trim()).to.not.have.lengthOf(0);
                } else if (typeof value === 'object') {
                    pm.expect(Object.keys(value)).to.not.have.lengthOf(0);
                }
            });
        });
    },

    ResponseTime: (maxTime = 200) => {
        const desc = Helper.GenerateTestDesc(`Response time is less than ${maxTime}ms`);
        pm.test(desc, () => {
            pm.expect(pm.response.responseTime).to.be.below(maxTime);
        });
    },

    GetVariable: (name) => {
        return pm.variables.get(name);
    },

    SetVariable: (name, value) => {
        pm.variables.set(name, value);
    },

    DeleteVariable: (name) => {
        pm.variables.unset(name);
    },

    Description: (desc) => {
        pm.variables.set('testDescription', desc);
    }
};

// Set up environment
pm.globals.set('Test', JSON.stringify(Test));
//pm.globals.set('Helper', Helper);
//pm.globals.set('keys', keys);
//pm.globals.set('helperKeys', helperKeys);
