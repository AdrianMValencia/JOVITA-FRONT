import { Component, OnInit, Inject, Type } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";
import { Menu } from '../../../modulos/Seguridad/models/Menu';
import { UserService } from '../../../modulos/Seguridad/services/user.service';
import { Router } from '@angular/router';
import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UsuarioService } from '../../../modulos/Usuarios/service/usuario.service';
import { ModalUsuariosComponent } from '../../../modulos/Usuarios/modalUsuarios/modalUsuarios.component';
import { Permisos } from '../../../modulos/Usuarios/models/permisos';
import { Usuarios } from '../../../modulos/Usuarios/models/Usurarios';
import { SubMenu } from '../../../modulos/Seguridad/models/SubMenu';
import { FuncionesService } from '../../services/funciones.service';
import { DatosEmpresaService } from '../../../modulos/configuracion/datosEmpresa/service/datosEmpresa.service';
declare function inspinia(): any;

// Modals
const MODALS: { [name: string]: Type<any> } = {
  usuarios: ModalUsuariosComponent,
};

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  providers: [UsuarioService]
})
export class HeaderComponent implements OnInit {
  lMenuName: string | any;
  lMenuList: Menu[] = [];
  lSubMenuList: SubMenu[] = [];
  lMenuBoolean: boolean = false;
  permisos: Permisos[] = [];

  NgbModalOptions: NgbModalOptions = {
    size: 'lg',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public userService: UserService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private _modalService: NgbModal,
    private service: UsuarioService,
    public funcionesService: FuncionesService,
    public datosEmpresaService: DatosEmpresaService
  ) {}

  ngOnInit(): void {
    this.spinner.show();

    inspinia();

    // try to read stored values, fall back to service in case storage is empty or invalid
    const json: any = localStorage.getItem('usuario');
    let usuario: Usuarios | any = JSON.parse(json || '{}');
    let id = usuario?.id || 0;
    this.lMenuName = usuario?.nombre || '';

    // safe parsers
    const parseJson = (key: string) => {
      try {
        const str = localStorage.getItem(key);
        if (!str) { return []; }
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn(`header: failed to parse ${key}`, e);
        return [];
      }
    };

    this.lMenuList = parseJson('menu');
    if (!this.lMenuList.length && Array.isArray(this.userService.menu)) {
      // use service state if storage is empty (happens during HMR or race)
      this.lMenuList = this.userService.menu;
    }
    this.lMenuList.forEach(el => el['listado'] = []);

    this.lSubMenuList = parseJson('subMenu');
    this.permisos = parseJson('permisos');

    // filter permissions belonging to current user
    this.permisos = this.permisos.filter((x: any) => parseInt(x.idUsuario) === parseInt(id));

    // build menu->submenu relationships
    this.permisos.forEach((result: any) => {
      this.lMenuList.forEach((element: Menu) => {
        this.lSubMenuList.forEach(datos => {
          if (element.id === parseInt(datos.idModulo)) {
            if (datos.id === parseInt(result.idSubModulo)) {
              if (parseInt(result.completed) === 1) {
                element.listado.push({
                  idModulo: datos.idModulo,
                  ruta: datos.ruta,
                  nombre: datos.nombre,
                  orden: datos.orden
                });
              }
            }
          }
        });
        element.listado.sort(this.SortByName);
      });
    });

    const itemsContabilidadExtra = [
      {
        idModulo: 990100,
        nombre: 'Inventario valorizado SUNAT',
        ruta: 'contabilidad/inventario-valorizado-sunat',
        orden: 3
      },
      {
        idModulo: 990100,
        nombre: 'Consulta de Stock',
        ruta: 'almacen/stock-tiendas',
        orden: 4
      },
      {
        idModulo: 990100,
        nombre: 'Kardex General',
        ruta: 'contabilidad/kardex-general',
        orden: 5
      }
    ];

    const inyectarItemsContabilidad = (listado: any[]): void => {
      itemsContabilidadExtra.forEach((item) => {
        if (!listado.some((s) => s.ruta === item.ruta)) {
          listado.push(item);
        }
      });
      listado.sort(this.SortByName);
    };

    const yaContabilidad = this.lMenuList.some(
      (m: any) => String(m?.nombre || '').toLowerCase().trim() === 'contabilidad'
    );
    if (!yaContabilidad) {
      this.lMenuList.push({
        id: 990100,
        nombre: 'Contabilidad',
        orden: 950,
        listado: [
          { idModulo: 990100, nombre: 'Reporte de Compras', ruta: 'contabilidad/rce-compras', orden: 1 },
          { idModulo: 990100, nombre: 'Reporte de Ventas', ruta: 'contabilidad/rce-ventas', orden: 2 },
          ...itemsContabilidadExtra
        ]
      } as Menu);
    } else {
      const contabilidad = this.lMenuList.find(
        (m: any) => String(m?.nombre || '').toLowerCase().trim() === 'contabilidad'
      );
      if (contabilidad?.listado) {
        inyectarItemsContabilidad(contabilidad.listado);
      }
    }

    if (!this.lMenuList.length) {
      console.warn('header: no menu items after filtering', {
        menu: this.lMenuList,
        subMenu: this.lSubMenuList,
        permisos: this.permisos
      });
    }

    this.spinner.hide();
  }

  SortByName(a: any, b: any){
    var aName = a.orden;
    var bName = b.orden;
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
  }


  mostrarItems(menuId: number): any{
    let contador: number = 0;
    this.lMenuList.forEach(element => {
      element.listado.forEach((element: any) => {
        if(parseInt(element.idModulo) === menuId){
          contador++;
        }
      });
    });

    if(contador > 0){
      return true;
    }
  }

  fnCerrarSesion() {
    this.spinner.show();
    this.userService.logout();
    this.spinner.hide();
  }

  fnChange(ruta: string) {
    this.spinner.show();
    this.router.navigateByUrl(`/${ruta}`);
    this.spinner.hide();
  }

  fnModificar(){
    let storage: any = localStorage.getItem('usuario');
    let usuario: string | any = JSON.parse(storage);
    this.router.navigate(['administracion/profile-usuario/', usuario.id]);
  }

  modificar(){
    let userName: string | any = localStorage.getItem('usuario');
    let userId = userName.split('.')[1];

    this.service.obtenerUsuarios(userId).subscribe((response: any) => {

      const modalRef = this._modalService.open(MODALS['usuarios'], this.NgbModalOptions);
      const obj: any = new Object();

      obj['opcion'] = 2;
      obj['usuarios'] = response.data;
      obj['lista'] = response.result;
      modalRef.componentInstance.fromParent = obj;
    });
  }
}
