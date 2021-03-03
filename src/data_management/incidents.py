import pandas as pd
from util import get_company_names, company_rename, most_common
import ssl
import json
import os
ssl._create_default_https_context = ssl._create_unverified_context
script_dir = os.path.dirname(__file__)


group1 = ['NOVA Gas Transmission Ltd.',
          'TransCanada PipeLines Limited',
          'Enbridge Pipelines Inc.',
          'Enbridge Pipelines (NW) Inc.',
          'Trans Mountain Pipeline ULC',
          'Trans Quebec and Maritimes Pipeline Inc.',
          'Trans-Northern Pipelines Inc.',
          'TransCanada Keystone Pipeline GP Ltd.',
          'Westcoast Energy Inc.',
          'Alliance Pipeline Ltd.',
          'PKM Cochin ULC',
          'Foothills Pipe Lines Ltd.',
          'Emera Brunswick Pipeline Company Ltd.',
          'Trans-Northern Pipelines Inc.',
          'Many Islands Pipe Lines (Canada) Limited',
          'Maritimes & Northeast Pipeline Management Ltd.']


def process_incidents(remote=False, land=False, company_names=False, companies=False, test=False):
    if remote:
        link = "https://www.cer-rec.gc.ca/en/safety-environment/industry-performance/interactive-pipeline/map/2020-12-31-comprehensive-incident-data.csv"
        print('downloading remote incidents file')
        df = pd.read_csv(link,
                         skiprows=1,
                         encoding="UTF-16",
                         error_bad_lines=False)
        df.to_csv("./raw_data/incidents.csv", index=False)
    elif test:
        print('reading test incidents file')
        df = pd.read_csv("./raw_data/test_data/comprehensive-incident-data.csv",
                         skiprows=0,
                         encoding="UTF-8",
                         error_bad_lines=False)
    else:
        print('reading local incidents file')
        df = pd.read_csv("./raw_data/comprehensive-incident-data.csv",
                         skiprows=0,
                         encoding='latin-1',
                         error_bad_lines=True)

    for vol in ['Approximate Volume Released (m³)', 'Approximate Volume Released (m3)']:
        try:
            df = df.rename(columns={vol: 'Approximate Volume Released'})
        except:
            None

    # initial data processing
    df['Company'] = df['Company'].replace(company_rename())
    df['Company'] = [x if x in group1 else "Group 2" for x in df['Company']]

    df['Approximate Volume Released'] = pd.to_numeric(df['Approximate Volume Released'],
                                                      errors='coerce')
    df['Reported Date'] = pd.to_datetime(df['Reported Date'], errors='raise')
    df['Substance'] = df['Substance'].replace({"Water": "Other",
                                               "Hydrogen Sulphide": "Other",
                                               "Amine": "Other",
                                               "Contaminated Water": "Other",
                                               "Potassium Hydroxide (caustic solution)": "Other",
                                               "Glycol": "Other",
                                               "Pulp slurry": "Other",
                                               "Sulphur": "Other",
                                               "Odourant": "Other",
                                               "Potassium Carbonate": "Other",
                                               "Waste Oil": "Other",
                                               "Produced Water": "Other",
                                               "Butane": "Natural Gas Liquids",
                                               "Mixed HVP Hydrocarbons": "Other",
                                               "Drilling Fluid": "Other",
                                               "Jet Fuel": "Other",
                                               "Gasoline": "Other",
                                               "Sulphur Dioxide": "Other",
                                               "Lube Oil": "Other",
                                               "Propane": "Natural Gas Liquids",
                                               "Fuel Gas": "Other",
                                               "Diesel Fuel": "Other"})

    if company_names:
        print(get_company_names(df['Company']))

    keep = ['Incident Number',
            'Incident Types',
            'Province',
            'Company',
            'Status',
            'Latitude',
            'Longitude',
            'Approximate Volume Released',
            'Substance',
            'Year',
            'What happened category',
            'Why it happened category',
            'Activity being performed at time of incident',
            'How the incident was discovered',
            'Incident type',
            'Residual effects on the environment',
            'Number of fatalities',
            'Number of individuals injured',
            'Off Company Property',
            'Was NEB Staff Deployed']

    for col in df.columns:
        if col not in keep:
            del df[col]

    df = df.rename(columns={'What happened category': 'What happened',
                            'Why it happened category': 'Why it happened',
                            'Activity being performed at time of incident': 'Activity at time of incident',
                            'How the incident was discovered': 'How was it discovered'})
    # df = df[~df['Approximate Volume Released'].isnull()].copy().reset_index(drop=True)
    fillZero = ['Approximate Volume Released', 'Number of fatalities', 'Number of individuals injured']
    for f in fillZero:
        df[f] = df[f].fillna(0)
        
    fillOther = ['How was it discovered']
    for f in fillOther:
        df[f] = df[f].fillna("Other")

    textCols = ['Incident Number',
                'Incident Types',
                'Province',
                'Company',
                'Status',
                'Substance',
                'What happened',
                'Why it happened',
                'Activity at time of incident',
                'How was it discovered',
                'Incident type',
                'Residual effects on the environment',
                'Off Company Property',
                'Was NEB Staff Deployed']

    for t in textCols:
        df[t] = [str(x).strip() for x in df[t]]

    meta = {}
    allCompanyData = {}
    allCompanyData['meta'] = meta
    allCompanyData['events'] = df.to_dict(orient='records')
    if not test:
        with open('../incidents/incident_releases.json', 'w') as fp:
            json.dump(allCompanyData, fp)

    return allCompanyData, df


if __name__ == '__main__':
    print('starting incidents...')
    allCompanyData, df = process_incidents(remote=False)
    print('completed incidents!')

#%%