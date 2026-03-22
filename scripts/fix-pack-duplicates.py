#!/usr/bin/env python3
"""
Fix cross-level duplicate words in starter packs.

Strategy: For each language pair, keep each word in its lowest-level pack
and remove it from higher-level packs. This preserves the original data
while ensuring no duplicates across levels.

Level order (lowest to highest): A1, A2, B1, B2, C1, C2
"""

import json
import os

PACKS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'starter-packs')
LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
LEVEL_FILES = {
    'A1': 'a1', 'A2': 'a2', 'B1': 'b1', 'B2': 'b2', 'C1': 'c1', 'C2': 'c2'
}
PAIRS = ['en-lv', 'ru-en', 'ru-lv']


def load_pack(pack_id: str) -> dict:
    path = os.path.join(PACKS_DIR, f'{pack_id}.json')
    with open(path) as f:
        return json.load(f)


def save_pack(pack_id: str, data: dict) -> None:
    path = os.path.join(PACKS_DIR, f'{pack_id}.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def fix_pair(pair: str) -> None:
    print(f'\nProcessing {pair}...')

    # Load all packs for this pair
    packs = {}
    for level in LEVEL_ORDER:
        pack_id = f'{pair}-{LEVEL_FILES[level]}'
        packs[level] = load_pack(pack_id)

    # Track seen words (source+target key) as we go from lowest to highest level
    seen: set[tuple[str, str]] = set()
    removed_counts: dict[str, int] = {}

    for level in LEVEL_ORDER:
        pack = packs[level]
        original_words = pack['words']
        filtered_words = []
        removed = 0

        for word in original_words:
            key = (word['source'].lower().strip(), word['target'].lower().strip())
            if key in seen:
                removed += 1
            else:
                seen.add(key)
                filtered_words.append(word)

        removed_counts[level] = removed
        pack['words'] = filtered_words

    # Report and save
    for level in LEVEL_ORDER:
        pack_id = f'{pair}-{LEVEL_FILES[level]}'
        removed = removed_counts[level]
        word_count = len(packs[level]['words'])
        if removed > 0:
            print(f'  {pack_id}: removed {removed} duplicates, {word_count} words remaining')
        else:
            print(f'  {pack_id}: no duplicates, {word_count} words')
        save_pack(pack_id, packs[level])


def verify_no_duplicates() -> bool:
    print('\nVerifying no duplicates remain...')
    all_ok = True
    for pair in PAIRS:
        seen: set[tuple[str, str]] = set()
        pair_ok = True
        for level in LEVEL_ORDER:
            pack_id = f'{pair}-{LEVEL_FILES[level]}'
            pack = load_pack(pack_id)
            for word in pack['words']:
                key = (word['source'].lower().strip(), word['target'].lower().strip())
                if key in seen:
                    print(f'  ERROR: {pair}: duplicate {word["source"]}/{word["target"]} in {level}')
                    pair_ok = False
                    all_ok = False
                else:
                    seen.add(key)
        if pair_ok:
            print(f'  {pair}: OK')
    return all_ok


def main() -> None:
    print('Fixing cross-level duplicate words in starter packs...')
    print(f'Strategy: Keep words in lowest-level pack, remove from higher levels')

    for pair in PAIRS:
        fix_pair(pair)

    ok = verify_no_duplicates()

    print('\nFinal word counts:')
    for pair in PAIRS:
        counts = []
        for level in LEVEL_ORDER:
            pack_id = f'{pair}-{LEVEL_FILES[level]}'
            pack = load_pack(pack_id)
            counts.append(f'{level}:{len(pack["words"])}')
        print(f'  {pair}: {", ".join(counts)}')

    if ok:
        print('\nAll duplicates fixed successfully.')
    else:
        print('\nERROR: Some duplicates remain - check output above.')
        exit(1)


if __name__ == '__main__':
    main()
