import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SubirArchivoService {

  constructor() { }

  subirArchivo(archivo:File, tipo:string, id:string){
    return new Promise((resolve, reject)=>{

      let formData = new FormData();
      let xhr = new XMLHttpRequest();

      formData.append('imagen', archivo, archivo.name);

      xhr.onreadystatechange = function(){

        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response));
          }else{
            console.log('Fallo la subida');
            reject(xhr.response);
          }
        }
      };

      let url = environment.BASE_URL + 'upload/' + tipo + '/' + id;

      xhr.open('POST', url, true);
      xhr.send(formData);

    });

  }
}
