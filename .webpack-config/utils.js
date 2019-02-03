"use strict";
const path = require("path");
const fs = require("fs");
const _ = (module.exports = {});

_.cwd = file => {
	return path.join(process.cwd(), file || "");
};

/**
 * Copy CMD arguments to environment file
 * @param  {[type]} environment [description]
 * @return {[type]}            [description]
 */
_.configureEnviroment = environment => {
	// Copy configuration template and try to set initial env variables
	const envTemplateExample = path.resolve(__dirname, `../config/env_${environment}.example.json`);
	const envTemplateFinal = path.join(__dirname, `../config/env_${environment}.json`);

	if (!fs.existsSync(envTemplateFinal)) {
		if (argv) {
			let envTemplate = require(envTemplateExample);

			if (typeof argv.isDemoServer !== "undefined") {
				envTemplate.isDemoServer = argv.isDemoServer;
			}
			if (typeof argv.server_frontend !== "undefined") {
				envTemplate.server.frontend = argv.server_frontend;
			}
			if (typeof argv.server_backend !== "undefined") {
				envTemplate.server.backend = argv.server_backend;
			}
			if (typeof argv.server_homepage !== "undefined") {
				envTemplate.server.homepage = argv.server_homepage;
			}
			if (typeof argv.api_secret !== "undefined") {
				envTemplate.api.secret = argv.api_secret;
			}
			if (typeof argv.api_chargebee_site_name !== "undefined") {
				envTemplate.api.chargebee_site_name = argv.api_chargebee_site_name;
			}
			if (typeof argv.api_chargebee !== "undefined") {
				envTemplate.api.chargebee = argv.api_chargebee;
			}
			envTemplate = JSON.stringify(envTemplate, null, 2);
			fs.writeFileSync(envTemplateFinal, envTemplate);
			// Example of usage:
			// yarn run start:web --server_frontend=xyc --server_backend=xyc --server_homepage=xyc --api_secret=xyc --api_chargebee_site_name=xyc --api_chargebee=xyc
		}
	}
	return envTemplateFinal;
};
