import { SubMenu } from "./SubMenu";

export class Menu{
  constructor(
    public id?: number | any,
    public nombre?: string | any,
    public orden?: number | any,
    public listado?: SubMenu[] | any
  ){}
}
