import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mayuscula'
})
export class MayusculaPipe implements PipeTransform {

  transform(value: any): any {

    if(value !== undefined){
      return value.toUpperCase();
    }else{
      return '';
    }
  }

}
