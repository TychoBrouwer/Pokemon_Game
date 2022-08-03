from turtle import clear
import requests
import json
import re

moveObject = {}

for i in range(1, 826):
  url = 'https://pokeapi.co/api/v2/move/' + str(i) + '/'

  resp = requests.get(url=url)
  data = resp.json()

  generation = data['generation']['name']

  if generation == 'generation-i' or generation == 'generation-ii' or generation == 'generation-iii':
    del data['generation']
    del data['past_values']
    del data['learned_by_pokemon']
    del data['names']
    del data['effect_changes']

    flavourToDelete = []
    for k in range(len(data['flavor_text_entries'])):
      if data['flavor_text_entries'][k]['version_group']['name'] != 'ruby-sapphire':
        flavourToDelete.append(k)

      elif data['flavor_text_entries'][k]['language']['name'] != 'en':
        flavourToDelete.append(k)
      
      del data['flavor_text_entries'][k]['language']
      del data['flavor_text_entries'][k]['version_group']

    flavourToDelete.sort(reverse=True)

    for k in flavourToDelete:
      del data['flavor_text_entries'][k]

    if data['contest_combos']:
      if data['contest_combos']['normal']:
        if (data['contest_combos']['normal']['use_before']):
          for k in range(len(data['contest_combos']['normal']['use_before'])):
            del data['contest_combos']['normal']['use_before'][k]['url']

        if (data['contest_combos']['normal']['use_after']):
          for k in range(len(data['contest_combos']['normal']['use_after'])):
            del data['contest_combos']['normal']['use_after'][k]['url']


      if data['contest_combos']['super']:
        if (data['contest_combos']['super']['use_before']):
          for k in range(len(data['contest_combos']['super']['use_before'])):
            del data['contest_combos']['super']['use_before'][k]['url']

        if (data['contest_combos']['super']['use_after']):
          for k in range(len(data['contest_combos']['super']['use_after'])):
            del data['contest_combos']['super']['use_after'][k]['url']


    # del data['contest_effect']
    data['contest_type'] = data['contest_type']['name']
    data['damage_class'] = data['damage_class']['name']

    effectToDelete = []
    for k in range(len(data['effect_entries'])):
      if data['effect_entries'][k]['language']['name'] != 'en':
        effectToDelete.append(k)

      del data['effect_entries'][k]['language']
      
    effectToDelete.sort(reverse=True)
    for k in effectToDelete:
      del data['effect_entries'][k]

    machinesToDelete = []
    for k in range(len(data['machines'])):
      if data['machines'][k]['version_group']['name'] != 'ruby-sapphire':
        machinesToDelete.append(k)

      del data['machines'][k]['version_group']
      data['machines'][k]['machine'] = int(re.search('machine/[0-9]*/', data['machines'][k]['machine']['url']).group()[8:-1])
      
    machinesToDelete.sort(reverse=True)
    for k in machinesToDelete:
      del data['machines'][k]

    for k in range(len(data['stat_changes'])): 
      data['stat_changes'][k]['stat'] = data['stat_changes'][k]['stat']['name']

    data['contest_effect'] = int(re.search('contest-effect/[0-9]*/', data['contest_effect']['url']).group()[15:-1])

    data['meta']['ailment'] = data['meta']['ailment']['name']
    data['meta']['category'] = data['meta']['category']['name']

    data['super_contest_effect'] = int(re.search('super-contest-effect/[0-9]*/', data['super_contest_effect']['url']).group()[21:-1])
    
    data['target'] = data['target']['name']
    data['type'] = data['type']['name']

    moveObject[data['name']] = data

    json_string = json.dumps(moveObject)

    with open('move_index.json', 'w') as outfile:
      outfile.write(json_string)
