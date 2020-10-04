import fs from 'fs';
import path from 'path';
import { ResolvePlugin } from "webpack";
import { Resolver } from "enhanced-resolve";

export default class WorkspaceWebpackPlugin extends ResolvePlugin {
  apply(resolver: Resolver) {
    resolver.getHook(`before-module`).tapAsync(`WorkspaceWebpackPlugin`, (requestContext, resolveContext, callback) => {
      const pnp = require(`pnpapi`);

      let request = requestContext.request;
      let issuer = requestContext.context.issuer;

      // When using require.context, issuer seems to be false (cf https://github.com/webpack/webpack-dev-server/blob/d0725c98fb752d8c0b1e8c9067e526e22b5f5134/client-src/default/index.js#L94)
      if (!issuer) {
        issuer = `${requestContext.path}/`;
      // We only support issuer when they're absolute paths. I'm not sure the opposite can ever happen, but better check here.
      } else if (!path.isAbsolute(issuer)) {
        throw new Error(`Cannot successfully resolve this dependency - issuer not supported (${issuer})`);
      }

      if (filter) {
        const relative = path.relative(filter, issuer);
        if (path.isAbsolute(relative) || BACKWARD_PATH.test(relative)) {
          return callback(null);
        }
      }

      let resolutionIssuer = sourceLocation || issuer;
      let resolution;

      try {
        resolution = pnp.resolveToUnqualified(request, resolutionIssuer, {considerBuiltins: false});
      } catch (error) {
        if (resolveContext.missingDependencies)
          resolveContext.missingDependencies.add(requestContext.path);

        if (resolveContext.log)
          resolveContext.log(error.message);

        resolveContext.pnpErrors = resolveContext.pnpErrors || new Map();
        resolveContext.pnpErrors.set(issuer, error);

        return callback();
      }

      resolver.doResolve(
        resolvedHook,
        Object.assign({}, requestContext, {
          request: resolution,
        }),
        null,
        resolveContext,
        callback
      );
    });
  };
  }
}
