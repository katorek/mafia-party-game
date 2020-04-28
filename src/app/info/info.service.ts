import {Injectable} from '@angular/core';
import {data} from './data';

@Injectable({
  providedIn: 'root'
})
export class InfoService {

  constructor() {
  }

  getShowAndDescription(category: string, key: string): GameInfo {
    if(category && key){
      const val = this.get(category, key);
      return {
        show: val.show,
        desc: val.desc
      }
    }
    return {
      show: '',
      desc: '',
    }
  }

  private get(category: string, elementKey: string) {
    return data.find(e => e.key === category).data.find(k => k.name === elementKey);
  }

}

export interface GameInfo {
  show?: string;
  desc?: string;
}
