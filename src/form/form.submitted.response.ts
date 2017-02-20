import { FormElementError } from './form.error';

export class FormSubmittedResponse {
    constructor(public hasError: boolean,
        public errors: FormElementError[],
        public form: HTMLFormElement,
        public source: any) {
    }
}