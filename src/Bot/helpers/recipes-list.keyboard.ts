import { InlineKeyboardButton } from 'node-telegram-bot-api';

export const RECIPES_PAGE_SIZE = 8;

type RecipeRow = { id: string; title: string };

export function buildRecipesListPayload(
  recipes: RecipeRow[],
  page: number,
): { text: string; inline_keyboard: InlineKeyboardButton[][] } {
  const total = recipes.length;
  const totalPages = Math.max(1, Math.ceil(total / RECIPES_PAGE_SIZE));
  const p = Math.min(Math.max(0, page), totalPages - 1);
  const slice = recipes.slice(
    p * RECIPES_PAGE_SIZE,
    (p + 1) * RECIPES_PAGE_SIZE,
  );

  const rows: InlineKeyboardButton[][] = slice.map((r) => {
    const label =
      `🍲 ${r.title}`.length > 64
        ? `🍲 ${r.title}`.slice(0, 61) + '…'
        : `🍲 ${r.title}`;
    return [{ text: label, callback_data: `recipe_${r.id}` }];
  });

  const navRow: InlineKeyboardButton[] = [];
  if (p > 0) {
    navRow.push({ text: '◀️ Prev', callback_data: `recipes_pg_${p - 1}` });
  }
  navRow.push({
    text: `${p + 1} / ${totalPages}`,
    callback_data: 'recipes_pgnoop',
  });
  if (p < totalPages - 1) {
    navRow.push({ text: 'Next ▶️', callback_data: `recipes_pg_${p + 1}` });
  }
  rows.push(navRow);
  rows.push([{ text: '⬅️ Back', callback_data: 'menu_recipes' }]);

  return {
    text:
      `🍲 *Recipes* (${total} total)\n\n` +
      `Page *${p + 1}* of *${totalPages}* — tap a recipe for details.`,
    inline_keyboard: rows,
  };
}
