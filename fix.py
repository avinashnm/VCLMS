import sys

path = 'main_app/templates/hod_template/edit_experiment.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''                            <div class="form-group">
                                <label>Experiment Type</label>
                                <select class="form-control" name="type" required>
                                    <option value="simple_titration" {% if experiment.type=='simple_titration'
                                        %}selected{% endif %}>
                                        Simple Titration
                                    </option>
                                    <option value="double_indicator" {% if experiment.type=='double_indicator'
                                        %}selected{% endif %}>
                                        Double Indicator Titration
                                    </option>
                                    <option value="rast" {% if experiment.type=='rast' %}selected{% endif %}>
                                        Rast Method
                                    </option>
                                    <option value="placeholder" {% if experiment.type=='placeholder' %}selected{% endif
                                        %}>
                                        Placeholder
                                    </option>
                                </select>
                                <small class="text-muted">Choose the simulation template to be used.</small>
                            </div>'''

new_block = '''                            <div class="form-group">
                                <label>Experiment Type</label>
                                <!-- prettier-ignore -->
                                <!-- djlint:off -->
                                <select class="form-control" name="type" required>
                                    <option value="simple_titration" {% if experiment.type == 'simple_titration' %}selected{% endif %}>Simple Titration</option>
                                    <option value="double_indicator" {% if experiment.type == 'double_indicator' %}selected{% endif %}>Double Indicator Titration</option>
                                    <option value="rast" {% if experiment.type == 'rast' %}selected{% endif %}>Rast Method</option>
                                    <option value="placeholder" {% if experiment.type == 'placeholder' %}selected{% endif %}>Placeholder</option>
                                </select>
                                <!-- djlint:on -->
                                <small class="text-muted">Choose the simulation template to be used.</small>
                            </div>'''

old_block_normalized = old_block.replace('\r\n', '\n')
content_normalized = content.replace('\r\n', '\n')
new_block_normalized = new_block.replace('\r\n', '\n')

if old_block_normalized in content_normalized:
    new_content = content_normalized.replace(old_block_normalized, new_block_normalized)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print("FAILED TO FIND BLOCK")
