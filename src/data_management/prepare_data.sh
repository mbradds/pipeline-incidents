#!/bin/bash
eval "$(conda shell.bash hook)"
conda activate pipeline-incidents
cd src/data_management
python incidents.py
