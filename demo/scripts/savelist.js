

function saveFile(file) {
    this.file = file;
}

saveFile.prototype.sendMessageToServer = function(up, info) {
    var res = $.parseJSON(info);
    var domain = up.getOption('domain');
        url = domain + encodeURI(res.key);
    var link = domain + res.key;
        console.log(this.file);
    var data = {
      "filename":this.file.name,
      "filesize":this.file.size,
      "link":link,
      "url":url
    };
    $.ajax({//  向服务器post请求
         url:'/fileMessage',
         type:'POST',
         data:data,
         success:function(blockdata,status){//请求成功
            if(status == 'success'){//发送完之后，更新列表
              var update = new updateFileList();
                blockdata.forEach(function(blockdata) {
                    update.setUI(blockdata,'UserfsUploadProgress');
                });
             }
          },
         error:function(data,status){//请求失败
          if(status == "error"){
                console.log("请求失败");
             }
            }
    });
};


function updateFileList() {
}

updateFileList.prototype.setUI = function(blockdata, targetID) {

     this.fileProgressID = blockdata._id;
     this.fileProgressWrapper = $('#' + this.fileProgressID);
     if (!this.fileProgressWrapper.length) {

        this.fileProgressWrapper = $('<tr></tr>');
        var Wrappeer = this.fileProgressWrapper;
        Wrappeer.attr('id', this.fileProgressID).addClass('progressContainer');

        var progressText = $("<td/>");
        progressText.addClass('progressName').text(blockdata.name);


        var fileSize = plupload.formatSize(blockdata.size).toUpperCase();
        var progressSize = $("<td/>");
        progressSize.addClass("progressFileSize").text(fileSize);

        var progressBarTd = $("<td/>");
        var progressBarBox = $("<div/>");
        progressBarBox.addClass('info');
        var progressBarWrapper = $("<div/>");
        progressBarWrapper.addClass("progress progress-striped");

        var progressBar = $("<div/>");
        progressBar.addClass("progress-bar progress-bar-info")
            .attr('role', 'progressbar')
            .attr('aria-valuemax', 100)
            .attr('aria-valuenow', 0)
            .attr('aria-valuein', 0)
            .width('0%');

        var progressBarPercent = $('<span class=sr-only />');
        progressBarPercent.text(fileSize);

        var progressCancel = $('<a href=javascript:; />');
        progressCancel.show().addClass('progressCancel').text('×');

        progressBar.append(progressBarPercent);
        progressBarWrapper.append(progressBar);
        progressBarBox.append(progressBarWrapper);
        progressBarBox.append(progressCancel);

        var progressBarStatus = $('<div class="status text-center"/>');
        progressBarBox.append(progressBarStatus);
        progressBarTd.append(progressBarBox);

        Wrappeer.append(progressText);
        Wrappeer.append(progressSize);
        Wrappeer.append(progressBarTd);
        $('#' + targetID).append(Wrappeer);


      var td = this.fileProgressWrapper.find('td:eq(2)'),
        tdProgress = td.find('.progress');

    var url = blockdata.url;
    var link = blockdata.link;
    if (blockdata.url) {
        str = "<div><strong>Link:</strong><a href=" + url + " target='_blank' > " + link + "</a></div>" +
            "<div class=hash><strong>Hash:</strong>" + "res.hash" + "</div>";
    } else {
        str = "<div><strong>Link:</strong><a href=" + url + " target='_blank' > " + link + "</a></div>" +
            "<div class=hash><strong>Hash:</strong>" + res.hash + "</div>";
    }

    tdProgress.html(str).removeClass().next().next('.status').hide();
    td.find('.progressCancel').hide();

        
    }
};

 








