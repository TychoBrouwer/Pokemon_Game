from turtle import clear
import requests
import json
import re

itemObject = {}

for i in range(445, 460):
  url = 'https://pokeapi.co/api/v2/item/' + str(i) + '/'

  print(url)

  resp = requests.get(url=url)
  if resp.status_code != 404:
    data = resp.json()

    generation = data['game_indices'][0]['generation']['name']

    if generation == 'generation-iii':
      for k in range(len(data['game_indices'])):
        if data['game_indices'][k]['generation']['name'] == 'generation-iii':
          data['game_index'] = data['game_indices'][k]['game_index']

      del data['game_indices']

      id = data['name']
      
      for k in range(len(data['flavor_text_entries'])):
        if data['flavor_text_entries'][k]['language']['name'] == 'en' and data['flavor_text_entries'][k]['version_group']['name'] == 'ruby-sapphire':
          data['flavour_text_entry'] = data['flavor_text_entries'][k]['text']

      if 'flavour_text_entry' not in data:
        for k in range(len(data['flavor_text_entries'])):
          if data['flavor_text_entries'][k]['language']['name'] == 'en' and data['flavor_text_entries'][k]['version_group']['name'] == 'emerald':
            data['flavour_text_entry'] = data['flavor_text_entries'][k]['text']


      del data['flavor_text_entries']

      for k in range(len(data['attributes'])):
        data['attributes'][k] = data['attributes'][k]['name']

      for k in range(len(data['names'])):
        if data['names'][k]['language']['name'] == 'en':
          data['name'] = data['names'][k]['name']

      for k in range(len(data['effect_entries'])):
        if data['effect_entries'][k]['language']['name'] == 'en':
          data['effect'] = data['effect_entries'][k]['effect']
          data['short_effect'] = data['effect_entries'][k]['short_effect']

      held_by_pokemon = []

      for k in range(len(data['held_by_pokemon'])):
        for j in range(len(data['held_by_pokemon'][k]['version_details'])):
          if 'version_details' in data['held_by_pokemon'][k]:
            if data['held_by_pokemon'][k]['version_details'][j]['version']['name'] == 'ruby':
              pokemon = data['held_by_pokemon'][k]['pokemon']['name']
              rarity = data['held_by_pokemon'][k]['version_details'][j]['rarity']

              held_by_pokemon.append({ 'pokemon': pokemon, 'rarity': rarity })

      data['held_by_pokemon'] = held_by_pokemon

      for k in range(len(data['machines'])):
        if data['machines'][k]['version_group']['name'] == 'ruby-sapphire':
          machineId = int(re.search('machine/[0-9]*/', data['machines'][k]['machine']['url']).group()[8:-1])

          urlMachine = 'https://pokeapi.co/api/v2/machine/' + str(machineId) + '/'

          resp2 = requests.get(url=urlMachine)
          if resp2.status_code != 404:
            data2 = resp2.json()

            move = data2['move']['name'].replace('-', ' ')
            
            data['effect'] = 'Teaches ' + move.title() + ' to a compatible Pok\u00e9mon.'
            data['short_effect'] = 'Teaches ' + move.title() + ' to a compatible Pok\u00e9mon.'

      if data['baby_trigger_for'] is not None:
          evo_chain = int(re.search('chain/[0-9]*/', data['baby_trigger_for']['url']).group()[6:-1])

          urlMachine = 'https://pokeapi.co/api/v2/evolution-chain/' + str(evo_chain) + '/'

          resp2 = requests.get(url=urlMachine)
          if resp2.status_code != 404:
            data2 = resp2.json()

            species = data2['chain']['species']['name']
            
            data['baby_trigger_for'] = species

      if data['fling_effect'] is not None:
        data['fling_effect'] = data['fling_effect']['name']
      
      del data['effect_entries']
      del data['machines']
      del data['names']
      del data['sprites']

      data['category'] = data['category']['name']

      itemObject[id] = data

      json_string = json.dumps(itemObject)

      with open('item_index.json', 'w') as outfile:
        outfile.write(json_string)
