import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

document.addEventListener('DOMContentLoaded', () => {

    const mainContent = document.querySelector('.content');

    const sectionsToLoad = [
        'sections/01-introduction.html',
        'sections/02-team.html',
        'sections/03-product.html',
        'sections/04-rationale.html',
        'sections/05-flowchart.html',
        'sections/06-manual.html',
        'sections/07-terms.html'
    ];

    const loadSections = async () => {
        const responses = await Promise.all(sectionsToLoad.map(url => fetch(url)));

        const htmlSections = await Promise.all(responses.map(res => {
            if (!res.ok) {
                console.error(`Failed to load section: ${res.url}`);
                return `<section><p>Error: Could not load content from ${res.url}</p></section>`;
            }
            return res.text();
        }));

        mainContent.innerHTML += htmlSections.join('');

        mermaid.initialize({
            startOnLoad: true, theme: 'base', themeVariables: {
                'primaryColor': '#f8fafc',
                'mainBkg': '#f8fafc',
                'nodeBorder': '#1a3a53',
                'lineColor': '#475569'
            }
        });
        await mermaid.run();
    };

    loadSections();
});