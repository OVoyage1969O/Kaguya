import { getCollection } from 'astro:content';
import { bookshelfConfig } from '@/config';
import { url } from './url-utils';

/** One catalogue backed by published content, shared by exhibition and category pages. */
export async function getBookshelfCatalogue() {
  const content = await getCollection('bookshelf');
  return bookshelfConfig.categories.map(category => {
    const configured = [...category.entries, ...(category.subgroups ?? []).flatMap(group => group.entries)];
    const people = new Set((category.subgroups ?? []).flatMap(group => group.entries.map(entry => entry.title)));
    const items = content.filter(entry => entry.data.categoryId === category.id).map(entry => ({
      title: entry.data.title,
      summary: entry.data.summary || configured.find(item => item.title === entry.data.title)?.summary || '',
      href: url(`/bookshelf/entries/${category.id}/${encodeURIComponent(entry.data.title)}/`),
      categoryId: category.id,
      categoryName: category.name,
      image: entry.data.infobox?.image || '',
      person: entry.id.startsWith('characters/') || people.has(entry.data.title),
    })).sort((a,b) => {
      const order = (title:string) => {
        const index = configured.findIndex(entry => entry.title === title);
        return index < 0 ? configured.length : index;
      };
      return order(a.title)-order(b.title) || a.title.localeCompare(b.title,'zh-CN');
    });
    return {...category, items, href:url(`/bookshelf/category/${category.id}/`)};
  });
}
