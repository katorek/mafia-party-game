import {Topic} from './topic';

export interface Message {
  topic: Topic;
  data?: any;
}
