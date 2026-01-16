import { Component, OnInit } from '@angular/core';
import { BreadcrumbsService } from '../../services/breadcrumbs.service';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
})
export class BreadcrumbsComponent implements OnInit {

  label:string = '';

  constructor(public _services: BreadcrumbsService, public title:Title, public meta: Meta) {

  	this._services.getDataRoute()
  		.subscribe((data: any) => {

	  		//  console.log(data);

	  		this.label = data.titulo;

	  		this.title.setTitle(this.label);

	  		let metaTag: MetaDefinition = {
	  			name: 'description',
	  			content: this.label
	  		}

        let metaAuthor: MetaDefinition = {
          name: 'author',
          content: this.label
        }

        let metaKeywords: MetaDefinition = {
          name: 'keywords',
          content: this.label
        }


	  		this.meta.updateTag(metaTag);
        this.meta.updateTag(metaAuthor);
        this.meta.updateTag(metaKeywords);

  		});

  }

  ngOnInit() {
  }

}
