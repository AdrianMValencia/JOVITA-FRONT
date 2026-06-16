// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  BASE_URL:"http://127.0.0.1:8000/api/",
  BASE_URL_UPLOAD:"http://127.0.0.1:8000/",
  /** Si tiene texto, reemplaza la razón social del XML en el PDF ticket eFact (cabecera). */
  nombreEmpresaTicketEfact: 'JOVITA PRODUCTOS MASIVOS S.A.C.'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
