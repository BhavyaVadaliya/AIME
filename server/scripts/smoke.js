import http from 'http';

const PORT = process.env.PORT || 4000;

async function req(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: PORT,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        body: responseData
                    };
                    
                    // Try to parse JSON if content-type is application/json
                    if (res.headers['content-type']?.includes('application/json') && responseData) {
                        try {
                            result.body = JSON.parse(responseData);
                        } catch (e) {
                            // If parsing fails, keep the raw body
                        }
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Request error: ${error.message}`);
            reject(error);
        });

        if (body) {
            req.write(body);
        }
        
        req.end();
    });
}

const run = async () => {
    try {
        console.log(`Running smoke tests against http://localhost:${PORT}`);
        
        // Test health endpoint
        console.log('\nTesting health endpoint...');
        const health = await req('/health');
        console.log(`HEALTH [${health.status}]:`, typeof health.body === 'string' ? health.body : JSON.stringify(health.body, null, 2));
        
        // Test personas endpoint
        console.log('\nTesting personas endpoint...');
        const personas = await req('/persona');
        console.log(`PERSONAS [${personas.status}]:`, typeof personas.body === 'string' ? personas.body : JSON.stringify(personas.body, null, 2));
        
        // Test creators endpoint
        console.log('\nTesting creators endpoint...');
        const creators = await req('/creator');
        console.log(`CREATORS [${creators.status}]:`, typeof creators.body === 'string' ? creators.body : JSON.stringify(creators.body, null, 2));
        
        console.log('\nSmoke tests completed successfully!');
    } catch (error) {
        console.error('\nSmoke test failed:', error);
        process.exit(1);
    }
    
    process.exit(0);
};;
 
run();
