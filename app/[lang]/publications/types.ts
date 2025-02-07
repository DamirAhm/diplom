export type Publication = {
    id: number;
    title: {
        en: string;
        ru: string;
    };
    authors: string;
    journal: string;
    year: number;
    link: string;
}

