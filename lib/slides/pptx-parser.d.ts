declare module 'pptx-parser' {
  export default class PPTXParser {
    constructor(buffer?: Buffer)
    parse(buffer?: Buffer): Promise<any[]>
  }
  
  export class PPTXParser {
    constructor(buffer?: Buffer)
    parse(buffer?: Buffer): Promise<any[]>
  }
}

